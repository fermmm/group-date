import * as moment from 'moment';
import { MarkRequired } from 'ts-essentials';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, column, g, P, sendQuery } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { GROUP_SLOTS_CONFIGS, NEW_MESSAGE_NOTIFICATION_INSISTING_INTERVAL } from '../../configurations';
import { DayOption, Group, GroupChat, GroupMembership } from '../../shared-tools/endpoints-interfaces/groups';
import { GroupQuality } from '../groups-finder/tools/types';
import { queryToGetUserById } from '../user/queries';
import { generateId } from '../../common-tools/string-tools/string-tools';

/**
 * Creates a group and returns it as a traversal query.
 * This function should not be called directly, use createGroup() to create groups.
 */
export function queryToCreateGroup(params: CreateNewGroupParameters): Traversal {
   let traversal: Traversal = g
      .addV('group')
      .property('groupId', generateId())
      .property(
         'chat',
         serializeIfNeeded<GroupChat>({
            usersDownloadedLastMessage: [],
            messages: [],
         }),
      )
      .property('creationDate', moment().unix())
      .property('membersAmount', params.initialUsers?.usersIds.length ?? 0)
      .property('dayOptions', serializeIfNeeded(params.dayOptions))
      .property('usersThatAccepted', serializeIfNeeded([]))
      .property('initialQuality', params.initialQuality ?? GroupQuality.Good)
      .property('reminder1NotificationSent', false)
      .property('reminder2NotificationSent', false)
      .property('mostVotedDate', 0)
      .property('feedback', serializeIfNeeded([]));

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
         .as('group')
         .sideEffect(
            __.V()
               // Make queries selecting each user by the user id provided and add the member edge to the group
               .union(...settings.usersIds.map(u => __.has('userId', u)))
               .sideEffect(
                  __.addE('member')
                     .to('group')
                     .property('newMessagesRead', true)
                     .property('lastNotificationDate', 0),
               )
               // Add the corresponding slot edge, slots avoids adding the users in too many groups
               .sideEffect(__.addE('slot' + settings.slotToUse).to('group'))
               .sideEffect(__.property('lastGroupJoinedDate', moment().unix())),
         )
         .property('membersAmount', __.inE('member').count())

         // Replace the "Match" edges between the members of the group by a "SeenMatch" edge in order to be ignored
         // by the group finding algorithms. This avoids repeated groups or groups with repeated matches.
         .sideEffect(
            __.both('member')
               .bothE('Match')
               .where(__.bothV().simplePath().both('member').where(P.eq('group')))
               .dedup()
               .sideEffect(__.addE('SeenMatch').from_(__.inV()).to(__.outV()))
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
            __.hasLabel('slot' + i).where(
               __.inV()
                  .values('creationDate')
                  .is(P.lt(moment().unix() - slot.releaseTime)),
            ),
         ),
      )
      .drop();
}

export function queryToVoteDateIdeas(group: Traversal, userId: string, usersIdsToVote: string[]): Traversal {
   let traversal: Traversal = group
      .as('group')
      .V()
      .has('userId', userId)
      .as('user')
      .sideEffect(__.outE('dateIdeaVote').where(__.inV().as('group')).drop());

   usersIdsToVote.forEach(
      ideaUserId =>
         (traversal = traversal.sideEffect(
            __.addE('dateIdeaVote').to('group').property('ideaOfUser', ideaUserId),
         )),
   );

   traversal = traversal.select('group');

   return traversal;
}

export function queryToGetGroupById(groupId: string, onlyIfAMemberHasUserId?: string): Traversal {
   let traversal = g.V().has('group', 'groupId', groupId);

   if (onlyIfAMemberHasUserId != null) {
      traversal = traversal.where(__.in_('member').has('userId', onlyIfAMemberHasUserId));
   }

   return traversal;
}

export function queryToGetGroupsOfUserByUserId(userId: string): Traversal {
   return queryToGetUserById(userId).out('member');
}

export function queryToUpdateGroupProperty(
   group: MarkRequired<Partial<Group>, 'groupId'>,
   onlyIfAMemberHasUserId?: string,
): Promise<void> {
   let traversal = queryToGetGroupById(group.groupId, onlyIfAMemberHasUserId);

   for (const key of Object.keys(group)) {
      traversal = traversal.property(key, serializeIfNeeded(group[key]));
   }

   return sendQuery(() => traversal.iterate());
}

export function queryToUpdateMembershipProperty(
   groupId: string,
   userId: string,
   properties: Partial<GroupMembership>,
): Promise<void> {
   let traversal = queryToGetGroupById(groupId, userId);
   traversal = traversal.inE('member').where(__.outV().has('user', 'userId', userId));

   for (const key of Object.keys(properties)) {
      traversal = traversal.property(key, serializeIfNeeded(properties[key]));
   }

   return sendQuery(() => traversal.iterate());
}

/**
 * Gets the list of users that are able to receive new chat message notification.
 * Also this function updates membership properties to avoid notification spam
 */
export function queryToGetMembersForNewMsgNotification(groupId: string): Traversal {
   return queryToGetGroupById(groupId)
      .inE('member')
      .has('newMessagesRead', true)
      .has('lastNotificationDate', P.lt(moment().unix() - NEW_MESSAGE_NOTIFICATION_INSISTING_INTERVAL))
      .property('newMessagesRead', false)
      .property('lastNotificationDate', moment().unix())
      .outV();
}

export function queryToGetGroupsToSendReminder(
   timeRemaining: number,
   reminderProp: 'reminder1NotificationSent' | 'reminder2NotificationSent',
): Traversal {
   return g
      .V()
      .hasLabel('group')
      .has('mostVotedDate', P.inside(moment().unix(), moment().unix() + timeRemaining))
      .has(reminderProp, false)
      .property(reminderProp, true);
}

/**
 * Receives a traversal that selects one or more groups vertices and returns them in a value map format.
 * Also optionally includes the members list and date ideas.
 *
 * To experiment with this query:
 * https://gremlify.com/bqey3ricohp
 *
 * @param traversal A traversal that has one or more groups.
 * @param details Include or not the full group details default = true
 */
export function queryToGetGroupsInFinalFormat(
   traversal: Traversal,
   includeFullDetails: boolean = true,
): Traversal {
   let detailsTraversals: Traversal[] = [];

   if (includeFullDetails) {
      detailsTraversals = [
         // Add the details about the members of the group
         __.project('members').by(__.in_('member').valueMap().by(__.unfold()).fold()),

         // Add the details about the usersIds that received a vote to their date idea and who voted
         __.project('dateIdeasVotes').by(
            __.inE('dateIdeaVote').group().by('ideaOfUser').by(__.outV().values('userId').fold()),
         ),

         // Add the matches relationships
         __.project('matches').by(
            __.in_('member')
               .map(
                  __.project('userId', 'matches')
                     .by(__.values('userId'))
                     .by(__.both('SeenMatch').where(__.out('member').as('group')).values('userId').fold()),
               )
               .fold(),
         ),
      ];
   }

   traversal = traversal.map(
      __.as('group')
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
      return g.V().hasLabel('group').drop().iterate();
   }

   const ids: string[] = groups.map(u => u.groupId);
   return await sendQuery(() =>
      g
         .inject(ids)
         .unfold()
         .map(
            __.as('targetGroupId')
               .V()
               .hasLabel('group')
               .has('groupId', __.where(P.eq('targetGroupId')))
               .drop(),
         )
         .iterate(),
   );
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
