import { BaseContext } from "koa";
import * as moment from "moment";
import { setIntervalAsync } from "set-interval-async/dynamic";
import {
   FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY,
   FIRST_DATE_REMINDER_TIME,
   GROUP_SLOTS_CONFIGS,
   MAX_WEEKEND_DAYS_VOTE_OPTIONS,
   SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY,
   SECOND_DATE_REMINDER_TIME,
} from "../../configurations";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import {
   BasicGroupParams,
   ChatPostParams,
   DateIdeaVotePostParams,
   DayOption,
   DayOptionsVotePostParams,
   FeedbackPostParams,
   Group,
   IdeaOption,
   UnreadMessagesAmount,
} from "../../shared-tools/endpoints-interfaces/groups";
import { NotificationType, User } from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveFullyRegisteredUser } from "../user/models";
import {
   GroupFilters,
   queryToFindSlotsToRelease,
   queryToGetReadMessagesAndTotal,
   queryToGetGroupsToSendReminder,
   queryToGetMembersForNewMsgNotification,
   queryToUpdatedReadMessagesAmount,
   queryToUpdateMembershipProperty,
} from "./queries";
import {
   AddUsersToGroupSettings,
   queryToAddUsersToGroup,
   queryToCreateGroup,
   queryToGetGroupById,
   queryToGetAllGroupsOfUser,
   queryToUpdateGroupProperty,
   queryToVoteDateIdeas,
} from "./queries";
import { fromQueryToGroup, fromQueryToGroupList } from "./tools/data-conversion";
import { GroupQuality } from "../groups-finder/tools/types";
import { generateId, toFirstUpperCase } from "../../common-tools/string-tools/string-tools";
import { sendQuery } from "../../common-tools/database-tools/database-manager";
import { t } from "../../common-tools/i18n-tools/i18n-tools";
import {
   fromGremlinMapToObject,
   fromQueryToSpecificProps,
   fromQueryToSpecificPropValue,
} from "../../common-tools/database-tools/data-conversion-tools";

export async function initializeGroups(): Promise<void> {
   setIntervalAsync(findSlotsToRelease, FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY);
   setIntervalAsync(sendDateReminderNotifications, SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY);
}

/**
 * Internal function to create a group (this is not an endpoint)
 * @param initialUsers The initial users to add and the
 */
export async function createGroup(
   initialUsers?: AddUsersToGroupSettings,
   initialQuality?: GroupQuality,
): Promise<Group> {
   const dayOptions: DayOption[] = getComingWeekendDays(MAX_WEEKEND_DAYS_VOTE_OPTIONS).map(date => ({
      date,
      votersUserId: [],
   }));

   const resultGroup: Group = await fromQueryToGroup(
      queryToCreateGroup({ dayOptions, initialUsers, initialQuality }),
      false,
      true,
   );

   await queryToUpdateGroupProperty({ groupId: resultGroup.groupId, name: generateGroupName(resultGroup) });

   // Send notifications
   for (const userId of initialUsers.usersIds) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Group,
            title: "You are in a group!",
            text: "A group just formed and you like each other!",
         },
         true,
      );
   }

   return resultGroup;
}

/**
 * Internal function to get a group by Id (this is not an endpoint)
 */
export async function getGroupById(
   groupId: string,
   { includeFullDetails = false, protectPrivacy = true, filters, ctx }: GetGroupByIdOptions = {},
): Promise<Group> {
   const groupTraversal = queryToGetGroupById(groupId, filters);
   const result: Group = await fromQueryToGroup(groupTraversal, protectPrivacy, includeFullDetails);

   if (result == null && ctx != null) {
      ctx.throw(400, t("Group not found", { ctx }));
      return;
   }

   return result;
}

/**
 * Add users to a group (this is not an endpoint)
 */
export async function addUsersToGroup(groupId: string, users: AddUsersToGroupSettings): Promise<void> {
   const group = await fromQueryToGroup(
      queryToAddUsersToGroup(queryToGetGroupById(groupId), users),
      true,
      true,
   );

   await queryToUpdateGroupProperty({ groupId: group.groupId, name: generateGroupName(group) });

   // Send notifications:
   for (const userId of users.usersIds) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Group,
            title: "You are in a group!",
            text: "A group just formed and you like each other!",
         },
         true,
      );
   }
}

/**
 * Endpoints to get a specific group that the user is part of.
 */
export async function groupGet(params: BasicGroupParams, ctx: BaseContext): Promise<Group> {
   const group: Group = await getGroupById(params.groupId, {
      filters: { onlyIfAMemberHasToken: params.token },
      includeFullDetails: true,
      ctx,
   });
   return group;
}

/**
 * Endpoint to get all the groups the user is part of.
 */
export async function userGroupsGet(
   params: TokenParameter,
   ctx: BaseContext,
   fullInfo?: boolean,
): Promise<Group[]> {
   return fromQueryToGroupList(queryToGetAllGroupsOfUser(params.token), true, fullInfo ?? false);
}

/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
export async function dateIdeaVotePost(params: DateIdeaVotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const traversal = queryToVoteDateIdeas(
      queryToGetGroupById(params.groupId, { onlyIfAMemberHasToken: params.token }),
      user.userId,
      params.ideasToVoteAuthorsIds,
   );
   const group = await fromQueryToGroup(traversal, false, true);

   // Get the most voted idea:
   let mostVotedIdea: IdeaOption = null;
   group.dateIdeasVotes.forEach(idea => {
      if (mostVotedIdea == null || idea?.votersUserId?.length > mostVotedIdea?.votersUserId?.length) {
         mostVotedIdea = idea;
      }
   });

   if (mostVotedIdea != null) {
      await queryToUpdateGroupProperty({ groupId: group.groupId, mostVotedIdea: mostVotedIdea.ideaOfUser });
   }
}

/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
export async function dateDayVotePost(params: DayOptionsVotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      filters: { onlyIfAMemberHasToken: params.token },
      ctx,
   });
   let mostVotedDate: number = null;
   let mostVotedDateVotes: number = 0;

   for (const groupDayOption of group.dayOptions) {
      const userIsVotingThisOption: boolean = params.daysToVote.indexOf(groupDayOption.date) !== -1;
      const userIdPosOnVotes: number = groupDayOption.votersUserId.indexOf(user.userId);
      const optionAlreadyVoted: boolean = userIdPosOnVotes !== -1;

      if (userIsVotingThisOption) {
         if (!optionAlreadyVoted) {
            groupDayOption.votersUserId.push(user.userId);
         }
      } else {
         // Remove the user vote if it is there from a previous api call
         if (optionAlreadyVoted) {
            groupDayOption.votersUserId.splice(userIdPosOnVotes, 1);
         }
      }

      // Save the most voted date
      if (mostVotedDate == null || groupDayOption.votersUserId.length > mostVotedDateVotes) {
         mostVotedDate = groupDayOption.date;
         mostVotedDateVotes = groupDayOption.votersUserId.length;
      }
   }

   await queryToUpdateGroupProperty({ groupId: group.groupId, dayOptions: group.dayOptions, mostVotedDate });
}

/**
 * Optimized endpoint to get the chat value of the group and register the messages as read. This endpoint
 * is optimized as much as possible, so it doesn't parse the chat so the response can be faster and parsing is
 * done on the client, this means the returned value is a string to be parsed by the client.
 * The client receives a json string as usual so there is no difference, the difference is when this function
 * is called inside the server, the response it's not already parsed like the others.
 */
export async function chatGet(params: BasicGroupParams, ctx: BaseContext): Promise<string> {
   let traversal = queryToGetGroupById(params.groupId, { onlyIfAMemberHasToken: params.token });
   traversal = queryToUpdatedReadMessagesAmount(traversal, params.token, { returnGroup: false });
   traversal = queryToUpdateMembershipProperty(
      traversal,
      params.token,
      { newMessagesRead: true },
      { fromGroup: false },
   );
   return await fromQueryToSpecificPropValue<string>(traversal, "chat");
}

export async function chatUnreadAmountGet(
   params: BasicGroupParams,
   ctx: BaseContext,
): Promise<UnreadMessagesAmount> {
   let traversal = queryToGetGroupById(params.groupId, { onlyIfAMemberHasToken: params.token });
   traversal = queryToGetReadMessagesAndTotal(traversal, params.token);
   const result = fromGremlinMapToObject<{ read: number; total: number }>(
      (await sendQuery(() => traversal.next())).value,
   );
   return { unread: (result?.total ?? 0) - (result?.read ?? 0) };
}

export async function voteResultGet(
   params: BasicGroupParams,
   ctx: BaseContext,
): Promise<Pick<Group, "mostVotedDate" | "mostVotedIdea">> {
   let traversal = queryToGetGroupById(params.groupId, { onlyIfAMemberHasToken: params.token });
   const result = await fromQueryToSpecificProps<Pick<Group, "mostVotedDate" | "mostVotedIdea">>(traversal, [
      "mostVotedDate",
      "mostVotedIdea",
   ]);
   return result;
}

/**
 * Endpoint to send a chat message to a group
 */
export async function chatPost(params: ChatPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      filters: { onlyIfAMemberHasToken: params.token },
      includeFullDetails: false,
      ctx,
   });

   group.chat.messages.push({
      chatMessageId: generateId(),
      messageText: params.message,
      time: moment().unix(),
      authorUserId: user.userId,
   });

   await queryToUpdateGroupProperty({
      groupId: group.groupId,
      chat: group.chat,
      chatMessagesAmount: group.chat.messages.length,
   });

   // Send a notification to group members informing that there is a new message
   const usersToReceiveNotification: string[] = (await queryToGetMembersForNewMsgNotification(group.groupId)
      .values("userId")
      .toList()) as string[];

   for (const userId of usersToReceiveNotification) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Chat,
            title: "New chat messages",
            text: "There are new chat messages in your group date",
            targetId: group.groupId,
            // Previous notifications that has the same value here are replaced
            idForReplacement: group.groupId,
         },
         true,
      );
   }
}

/**
 * Endpoint to send feedback about a group experience
 */
export async function feedbackPost(params: FeedbackPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      filters: { onlyIfAMemberHasToken: params.token },
      protectPrivacy: false,
      ctx,
   });

   if (group.feedback.find(f => f.userId === user.userId) == null) {
      group.feedback.push({
         userId: user.userId,
         feedbackType: params.feedback.feedbackType,
         description: params.feedback.description,
      });

      await queryToUpdateGroupProperty({ groupId: group.groupId, feedback: group.feedback });
   }
}

export async function findSlotsToRelease(): Promise<void> {
   return await queryToFindSlotsToRelease().iterate();
}

export async function sendDateReminderNotifications(): Promise<void> {
   const reminders: Array<{
      time: number;
      reminderProp: "reminder1NotificationSent" | "reminder2NotificationSent";
   }> = [
      {
         time: FIRST_DATE_REMINDER_TIME,
         reminderProp: "reminder1NotificationSent",
      },
      {
         time: SECOND_DATE_REMINDER_TIME,
         reminderProp: "reminder2NotificationSent",
      },
   ];

   for (const reminder of reminders) {
      const groups: Group[] = await fromQueryToGroupList(
         queryToGetGroupsToSendReminder(reminder.time, reminder.reminderProp),
         false,
         true,
      );

      for (const group of groups) {
         for (const user of group.members) {
            await addNotificationToUser(
               { userId: user.userId },
               {
                  type: NotificationType.Group,
                  title: t("Date reminder", { user }),
                  text: t(
                     "Your group date will be in less than %s",
                     { user },
                     moment.duration(reminder.time, "seconds").locale(user.language).humanize(),
                  ),
                  targetId: group.groupId,
               },
            );
         }
      }
   }
}

function getComingWeekendDays(limitAmount: number): number[] {
   const result: number[] = [];
   let i: number = 1;

   while (result.length < limitAmount) {
      const dayToCheck: moment.Moment = moment().add(i, "day");
      const weekDay: number = dayToCheck.weekday();
      if (weekDay === 5 || weekDay === 6 || weekDay === 0) {
         result.push(dayToCheck.unix());
      }
      i++;
   }

   return result;
}

function generateGroupName(group: Group): string {
   const membersNames = group.members?.map(member => toFirstUpperCase(member.name));
   return membersNames.join(", ") ?? "";
}

export function getSlotIdFromUsersAmount(amount: number): number {
   return GROUP_SLOTS_CONFIGS.findIndex(slot => amount >= slot.minimumSize && amount <= slot.maximumSize);
}

interface GetGroupByIdOptions {
   includeFullDetails?: boolean;
   filters?: GroupFilters;
   protectPrivacy?: boolean;
   ctx?: BaseContext;
}
