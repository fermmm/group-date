import { BaseContext } from 'koa';
import * as moment from 'moment';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import {
   FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY,
   FIRST_DATE_REMINDER_TIME,
   GROUP_SLOTS_CONFIGS,
   MAX_CHAT_MESSAGES_STORED_ON_SERVER,
   MAX_WEEKEND_DAYS_VOTE_OPTIONS,
   SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY,
   SECOND_DATE_REMINDER_TIME,
} from '../../configurations';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import {
   BasicGroupParams,
   ChatPostParams,
   DateIdeaVotePostParams,
   DayOption,
   DayOptionsVotePostParams,
   FeedbackPostParams,
   Group,
} from '../../shared-tools/endpoints-interfaces/groups';
import { NotificationType, User } from '../../shared-tools/endpoints-interfaces/user';
import { addNotificationToUser, retrieveFullyRegisteredUser } from '../user/models';
import {
   queryToFindSlotsToRelease,
   queryToGetGroupsToSendReminder,
   queryToGetMembersForNewMsgNotification,
   queryToUpdateMembershipProperty,
} from './queries';
import {
   AddUsersToGroupSettings,
   queryToAddUsersToGroup,
   queryToCreateGroup,
   queryToGetGroupById,
   queryToGetGroupsOfUserByUserId,
   queryToUpdateGroupProperty,
   queryToVoteDateIdeas,
} from './queries';
import { fromQueryToGroup, fromQueryToGroupList } from './tools/data-conversion';
import { GroupQuality } from '../groups-finder/tools/types';
import { generateId } from '../../common-tools/string-tools/string-tools';
import { sendQuery } from '../../common-tools/database-tools/database-manager';
import { t } from '../../common-tools/i18n-tools/i18n-tools';

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
   );

   // Send notifications
   for (const userId of initialUsers.usersIds) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Group,
            title: 'You are in a group!',
            text: 'A group just formed and you like each other!',
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
   { includeFullDetails = false, protectPrivacy = true, onlyIfAMemberHasUserId, ctx }: GetGroupByIdOptions = {},
): Promise<Group> {
   const groupTraversal = queryToGetGroupById(groupId, onlyIfAMemberHasUserId);
   const result: Group = await fromQueryToGroup(groupTraversal, protectPrivacy, includeFullDetails);

   if (result == null && ctx != null) {
      ctx.throw(400, t('Group not found', { ctx }));
      return;
   }

   return result;
}

/**
 * Add users to a group (this is not an endpoint)
 */
export async function addUsersToGroup(groupId: string, users: AddUsersToGroupSettings): Promise<void> {
   await sendQuery(() => queryToAddUsersToGroup(queryToGetGroupById(groupId), users).iterate());

   // Send notifications:
   for (const userId of users.usersIds) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Group,
            title: 'You are in a group!',
            text: 'A group just formed and you like each other!',
         },
         true,
      );
   }
}

/**
 * Endpoints to get a specific group that the user is part of.
 * This endpoint is also used to download the chat messages so also interacts with the
 * message read functionality.
 */
export async function groupGet(params: BasicGroupParams, ctx: BaseContext): Promise<Group> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      onlyIfAMemberHasUserId: user.userId,
      includeFullDetails: params.includeFullDetails,
      ctx,
   });

   await updateAndCleanChat(user, group);
   await queryToUpdateMembershipProperty(group.groupId, user.userId, { newMessagesRead: true });

   return group;
}

/**
 * Endpoint to get all the groups the user is part of.
 */
export async function userGroupsGet(params: TokenParameter, ctx: BaseContext): Promise<Group[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   return fromQueryToGroupList(queryToGetGroupsOfUserByUserId(user.userId));
}

/**
 * Endpoint to accept being part of a group. Currently this has no much effect other than showing that to others.
 */
export async function acceptPost(params: BasicGroupParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, { onlyIfAMemberHasUserId: user.userId, ctx });

   if (group.usersThatAccepted.indexOf(user.userId) === -1) {
      group.usersThatAccepted.push(user.userId);
   }
   await queryToUpdateGroupProperty({ groupId: group.groupId, usersThatAccepted: group.usersThatAccepted });
}

/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
export async function dateIdeaVotePost(params: DateIdeaVotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   await queryToVoteDateIdeas(
      queryToGetGroupById(params.groupId, user.userId),
      user.userId,
      params.ideasToVoteAuthorsIds,
   ).iterate();
}

/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
export async function dateDayVotePost(params: DayOptionsVotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, { onlyIfAMemberHasUserId: user.userId, ctx });
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
 * Endpoint to send a chat message to a group
 */
export async function chatPost(params: ChatPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      onlyIfAMemberHasUserId: user.userId,
      includeFullDetails: false,
      ctx,
   });

   group.chat.messages.push({
      chatMessageId: generateId(),
      messageText: params.message,
      time: moment().unix(),
      authorUserId: user.userId,
   });
   group.chat.usersDownloadedLastMessage = [];

   await queryToUpdateGroupProperty({ groupId: group.groupId, chat: group.chat });

   // Send a notification to group members informing that there is a new message
   const usersToReceiveNotification: string[] = (await queryToGetMembersForNewMsgNotification(group.groupId)
      .values('userId')
      .toList()) as string[];

   for (const userId of usersToReceiveNotification) {
      await addNotificationToUser(
         { userId },
         {
            type: NotificationType.Chat,
            title: 'New chat messages',
            text: 'There are new chat messages in your group date',
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
      onlyIfAMemberHasUserId: user.userId,
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
      reminderProp: 'reminder1NotificationSent' | 'reminder2NotificationSent';
   }> = [
      {
         time: FIRST_DATE_REMINDER_TIME,
         reminderProp: 'reminder1NotificationSent',
      },
      {
         time: SECOND_DATE_REMINDER_TIME,
         reminderProp: 'reminder2NotificationSent',
      },
   ];

   for (const reminder of reminders) {
      const groups: Group[] = await fromQueryToGroupList(
         queryToGetGroupsToSendReminder(reminder.time, reminder.reminderProp),
         false,
         true,
      );

      const currentTime: number = moment().unix();

      for (const group of groups) {
         for (const user of group.members) {
            await addNotificationToUser(
               { userId: user.userId },
               {
                  type: NotificationType.Group,
                  title: t('Date reminder', { user }),
                  text: t(
                     'Your group date will be in less than %s',
                     { user },
                     moment.duration(reminder.time, 'seconds').locale(user.language).humanize(),
                  ),
                  targetId: group.groupId,
               },
            );
         }
      }
   }
}

/**
 * Internal function that adds the user to the read list and removes last messages
 * that should be already catched by the client.
 */
async function updateAndCleanChat(user: User, group: Group): Promise<void> {
   let updateChanges: boolean = false;

   // Add user in the list of users that downloaded the last message:
   if (group.chat.usersDownloadedLastMessage.indexOf(user.userId) === -1) {
      group.chat.usersDownloadedLastMessage.push(user.userId);
      updateChanges = true;
   }

   // If all users downloaded the last message and there are many chat messages
   if (
      group.chat.usersDownloadedLastMessage.length === group.membersAmount &&
      group.chat.messages.length > MAX_CHAT_MESSAGES_STORED_ON_SERVER
   ) {
      // Remove all chat messages except for the last ones to optimize data transfer next time
      group.chat.messages = group.chat.messages.slice(-1 * MAX_CHAT_MESSAGES_STORED_ON_SERVER);
      updateChanges = true;
   }

   if (updateChanges) {
      await queryToUpdateGroupProperty({ groupId: group.groupId, chat: group.chat });
   }
}

function getComingWeekendDays(limitAmount: number): number[] {
   const result: number[] = [];
   let i: number = 1;

   while (result.length < limitAmount) {
      const dayToCheck: moment.Moment = moment().add(i, 'day');
      const weekDay: number = dayToCheck.weekday();
      if (weekDay === 5 || weekDay === 6 || weekDay === 0) {
         result.push(dayToCheck.unix());
      }
      i++;
   }

   return result;
}

export function getSlotIdFromUsersAmount(amount: number): number {
   return GROUP_SLOTS_CONFIGS.findIndex(slot => amount >= slot.minimumSize && amount <= slot.maximumSize);
}

interface GetGroupByIdOptions {
   includeFullDetails?: boolean;
   onlyIfAMemberHasUserId?: string;
   protectPrivacy?: boolean;
   ctx?: BaseContext;
}
