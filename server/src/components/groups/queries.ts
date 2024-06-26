import * as moment from "moment";
import { MarkRequired } from "ts-essentials";
import { encodeIfNeeded, serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { __, column, g, P, sendQuery, cardinality } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   ALWAYS_SHOW_REMOVE_SEEN_MENU,
   GROUP_ACTIVE_TIME,
   GROUP_SLOTS_CONFIGS,
   SEND_ONE_NOTIFICATION_PER_CHAT_MESSAGE,
} from "../../configurations";
import { DayOption, Group, GroupChat, GroupMembership } from "../../shared-tools/endpoints-interfaces/groups";
import { GroupQuality } from "../groups-finder/tools/types";
import { queryToGetUserByToken } from "../user/queries";
import { generateId } from "../../common-tools/string-tools/string-tools";

/**
 * Creates a group and returns it as a traversal query.
 * This function should not be called directly, use createGroup() to create groups.
 */
export function queryToCreateGroup(params: CreateNewGroupParameters): Traversal {
   let initialChat = serializeIfNeeded<GroupChat>({
      messages: [],
   }) as string;
   initialChat = encodeIfNeeded(initialChat, "chat", "group");
   let dayOptions = serializeIfNeeded(params.dayOptions);
   dayOptions = encodeIfNeeded(dayOptions, "dayOptions", "group");

   let traversal: Traversal = g
      .addV("group")
      .property(cardinality.single, "groupId", generateId())
      .property(cardinality.single, "chat", initialChat)
      .property(cardinality.single, "chatMessagesAmount", 0)
      .property(cardinality.single, "creationDate", moment().unix())
      .property(cardinality.single, "membersAmount", params.initialUsers?.usersIds.length ?? 0)
      .property(cardinality.single, "dayOptions", dayOptions)
      .property(cardinality.single, "initialQuality", params.initialQuality ?? GroupQuality.Good)
      .property(cardinality.single, "reminder1NotificationSent", false)
      .property(cardinality.single, "reminder2NotificationSent", false)
      .property(cardinality.single, "seenBy", "[]")
      .property(cardinality.single, "showRemoveSeenMenu", ALWAYS_SHOW_REMOVE_SEEN_MENU ? true : false)
      .property(cardinality.single, "isActive", true);

   if (params.initialUsers != null) {
      traversal = queryToAddUsersToGroup(traversal, params.initialUsers);
   }

   return traversal;
}

/**
 * Receives a traversal that selects a group and adds users to the group, also returns the group vertex.
 * Also changes the "Match" edges between the members for new "SeenMatch" edges to be ignored by the group
 * finding algorithms avoiding repeated groups or groups with repeated matches.
 *
 * @param group The traversal that returns a group vertex.
 * @param usersIds The list of user ids to add to the group.
 * @param slotToUse The id of the slot that will be used on the users being added to the group. You can use getSlotIdFromUsersAmount() to get this value
 */
export function queryToAddUsersToGroup(group: Traversal, settings: AddUsersToGroupSettings): Traversal {
   return (
      group
         .as("group")
         .sideEffect(
            __.V()
               // Make queries selecting each user by the user id provided and add the member edge to the group
               .union(...settings.usersIds.map(u => __.has("userId", u)))
               .sideEffect(
                  __.addE("member")
                     .to("group")
                     .property("newMessagesRead", true)
                     .property("readMessagesAmount", 0),
               )
               // Add the corresponding slot edge, slots avoids adding the users in too many groups
               .sideEffect(__.addE("slot" + settings.slotToUse).to("group"))
               .sideEffect(__.property(cardinality.single, "lastGroupJoinedDate", moment().unix())),
         )
         .property(cardinality.single, "membersAmount", __.inE("member").count())

         // Replace the "Match" edges between the members of the group by a "SeenMatch" edge in order to be ignored
         // by the group finding algorithms. This avoids repeated groups or groups with repeated matches.
         .sideEffect(
            __.both("member")
               .bothE("Match")
               .where(__.bothV().simplePath().both("member").where(P.eq("group")))
               .dedup()
               .sideEffect(__.addE("SeenMatch").from_(__.inV()).to(__.outV()))
               .drop(),
         )
   );
}

/**
 * Finds group slots that can be released and releases them. Removed the slot edge.
 * You can play with this query here: https://gremlify.com/t0km39qnpm
 */
export function queryToFindSlotsToRelease(): Traversal {
   return g
      .E()
      .union(
         ...GROUP_SLOTS_CONFIGS.map((slot, i) =>
            __.hasLabel("slot" + i).where(
               __.inV()
                  .values("creationDate")
                  .is(P.lt(moment().unix() - slot.releaseTime)),
            ),
         ),
      )
      .drop();
}

/**
 * Registers a vote to the date idea and returns the group vertex
 */
export function queryToVoteDateIdeas(group: Traversal, userId: string, usersIdsToVote: string[]): Traversal {
   let traversal: Traversal = group
      .as("group")
      .V()
      .has("userId", userId)
      .as("user")
      .sideEffect(__.outE("dateIdeaVote").where(__.inV().as("group")).drop());

   usersIdsToVote.forEach(
      ideaUserId =>
         (traversal = traversal.sideEffect(
            // cardinality.single is not used here because we are positioned in an edge
            __.addE("dateIdeaVote").to("group").property("ideaOfUser", ideaUserId),
         )),
   );

   traversal = traversal.select("group");

   return traversal;
}

export function queryToGetGroupById(groupId: string, filters?: GroupFilters): Traversal {
   let traversal = g.V().has("group", "groupId", groupId);

   if (filters?.onlyIfAMemberHasUserId != null) {
      traversal = traversal.where(__.in_("member").has("userId", filters.onlyIfAMemberHasUserId));
   }

   if (filters?.onlyIfAMemberHasToken != null) {
      traversal = traversal.where(__.in_("member").has("token", filters.onlyIfAMemberHasToken));
   }

   return traversal;
}

export function queryToGetAllGroupsOfUser(userToken: string): Traversal {
   return queryToGetUserByToken(userToken, null, true).out("member");
}

// For admin usage only
export function queryToGetAllGroups(includeDemoGroups: boolean = false): Traversal {
   let traversal = g.V().hasLabel("group");

   if (!includeDemoGroups) {
      traversal = traversal.not(__.has("demoGroup", true));
   }

   return traversal;
}

export function queryToUpdateGroupProperty(
   newProps: MarkRequired<Partial<Group>, "groupId">,
   filters?: GroupFilters,
): Promise<void> {
   let traversal = queryToGetGroupById(newProps.groupId, filters);

   for (const key of Object.keys(newProps)) {
      let value = newProps[key];

      if (value == null) {
         continue;
      }

      value = serializeIfNeeded(value);
      value = encodeIfNeeded(value, key, "group"); // This should be after serializeIfNeeded() so it can act in the case of a json stringified covering all the sub-properties

      traversal = traversal.property(cardinality.single, key, value);
   }

   return sendQuery(() => traversal.iterate());
}

/**
 * Receives a traversal that selects a members edge unless specified in the options parameter. Then
 * changes the specified member edge properties of the specified user and finally returns a traversal
 * with the group.
 */
export function queryToUpdateMembershipProperty(
   traversal: Traversal,
   userToken: string,
   properties: Partial<GroupMembership>,
   options?: { fromGroup?: boolean },
): Traversal {
   if (options?.fromGroup !== false) {
      traversal = traversal.inE("member").where(__.outV().has("user", "token", userToken));
   }

   for (const key of Object.keys(properties)) {
      // cardinality.single is not used here because we are positioned in an edge
      traversal = traversal.property(key, serializeIfNeeded(properties[key]));
   }

   traversal = traversal.inV();

   return traversal;
}

/**
 * Receives a traversal that selects a group and transfer the group value "chatMessagesAmount" to the
 * membership value "readMessagesAmount" to register the action of a user reading all current messages.
 * Returns the membership edge for more changes unless specified in the options parameter.
 */
export function queryToUpdatedReadMessagesAmount(
   traversal: Traversal,
   userToken: string,
   options?: { returnGroup?: boolean },
): Traversal {
   traversal = traversal.inE("member").where(__.outV().has("user", "token", userToken));
   traversal = traversal.property("readMessagesAmount", __.inV().values("chatMessagesAmount"));
   if (options?.returnGroup !== false) {
      traversal = traversal.inV();
   }
   return traversal;
}

/**
 * Receives a group traversal and returns a gremlin map with the read messages of the user and total group messages.
 * Useful to implement a badge of unread messages.
 */
export function queryToGetReadMessagesAndTotal(traversal: Traversal, userToken: string): Traversal {
   return traversal
      .project("read", "total")
      .by(__.inE("member").where(__.outV().has("user", "token", userToken)).values("readMessagesAmount"))
      .by(__.values("chatMessagesAmount"));
}

/**
 * Gets the list of users that are able to receive new chat message notification.
 * Also this function updates membership properties to avoid notification spam
 */
export function queryToGetMembersForNewMsgNotification(groupId: string, authorUserId: string): Traversal {
   // Get all members of the group
   let traversal = queryToGetGroupById(groupId).inE("member");

   // This prevents sending a notification to the author of the message
   traversal = traversal.not(__.outV().has("userId", authorUserId));

   // This prevents receiving a notification if the last one was ignored (less spam)
   // We don't use cardinality.single here because we are working on an edge
   if (!SEND_ONE_NOTIFICATION_PER_CHAT_MESSAGE) {
      traversal = traversal.has("newMessagesRead", true).property("newMessagesRead", false);
   }

   // Return the users
   traversal = traversal.outV();

   return traversal;
}

export function queryToGetGroupsToSendReminder(
   timeRemaining: number,
   reminderProp: "reminder1NotificationSent" | "reminder2NotificationSent",
): Traversal {
   return g
      .V()
      .hasLabel("group")
      .has("mostVotedDate", P.inside(moment().unix(), moment().unix() + timeRemaining))
      .has(reminderProp, false)
      .property(cardinality.single, reminderProp, true);
}

/**
 * Receives a traversal that selects one or more groups vertices and returns them in a value map format.
 * Also optionally includes the members list and date ideas.
 *
 * To experiment with this query:
 * https://gremlify.com/v333jvq76gr
 *
 * @param traversal A traversal that has one or more groups.
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 */
export function queryToGetGroupsInFinalFormat(
   traversal: Traversal,
   includeFullDetails: boolean = true,
): Traversal {
   let detailsTraversals: Traversal[] = [];

   if (includeFullDetails) {
      detailsTraversals = [
         // Add the details about the members of the group
         __.project("members").by(__.in_("member").valueMap().by(__.unfold()).fold()),

         // Add the details about the usersIds that received a vote to their date idea and who voted
         __.project("dateIdeasVotes").by(
            __.inE("dateIdeaVote")
               .group()
               .by("ideaOfUser")
               .by(__.outV().values("userId").fold())
               .unfold()
               .project("ideaOfUser", "votersUserId")
               .by(__.select(column.keys))
               .by(__.select(column.values))
               .fold(),
         ),

         // Add the matches relationships
         __.project("matches").by(
            __.in_("member")
               .map(
                  __.project("userId", "matches")
                     .by(__.values("userId"))
                     .by(__.both("SeenMatch").where(__.out("member").as("group")).values("userId").fold()),
               )
               .fold(),
         ),
      ];
   }

   traversal = traversal.map(
      __.as("group")
         .union(__.valueMap().by(__.unfold()), ...detailsTraversals)
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );

   return traversal;
}

/**
 * Only used in tests.
 * If no group list is provided all groups on the database are removed.
 */
export async function queryToRemoveGroups(groups?: Group[]): Promise<void> {
   if (groups == null) {
      return g.V().hasLabel("group").drop().iterate();
   }

   const ids: string[] = groups.map(u => u.groupId);
   return await sendQuery(() =>
      g
         .inject(ids)
         .unfold()
         .map(
            __.as("targetGroupId")
               .V()
               .hasLabel("group")
               .has("groupId", __.where(P.eq("targetGroupId")))
               .drop(),
         )
         .iterate(),
   );
}

export function queryToFindShouldBeInactiveGroups() {
   let traversal = queryToGetAllGroups().not(__.has("isActive", false));
   traversal = traversal.has("creationDate", P.lt(moment().unix() - GROUP_ACTIVE_TIME));
   return traversal;
}

export interface AddUsersToGroupSettings {
   usersIds: string[];
   slotToUse: number;
}

export interface CreateNewGroupParameters {
   dayOptions: DayOption[];
   initialQuality: GroupQuality;
   initialUsers?: AddUsersToGroupSettings;
}

export interface GroupFilters {
   onlyIfAMemberHasUserId?: string;
   onlyIfAMemberHasToken?: string;
}
