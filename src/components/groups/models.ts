import { BaseContext } from 'koa';
import * as moment from 'moment';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { v1 as uuidv1 } from 'uuid';
import {
   FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY,
   GROUP_SLOTS_CONFIGS,
   MAX_CHAT_MESSAGES_STORED_ON_SERVER,
   MAX_WEEKEND_DAYS_VOTE_OPTIONS,
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
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retrieveFullyRegisteredUser } from '../user/models';
import { queryToFindSlotsToRelease } from './queries';
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

export async function initializeGroups(): Promise<void> {
   setIntervalAsync(findSlotsToRelease, FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY);
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
   return fromQueryToGroup(queryToCreateGroup({ dayOptions, initialUsers, initialQuality }), false);
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
      ctx.throw(400, 'Group not found');
   }

   return result;
}

/**
 * Add users to a group (this is not an endpoint)
 */
export async function addUsersToGroup(groupId: string, users: AddUsersToGroupSettings): Promise<void> {
   await queryToAddUsersToGroup(queryToGetGroupById(groupId), users).iterate();
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
      includeFullDetails: true,
      ctx,
   });

   await updateAndCleanChat(user, group);

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
   }

   await queryToUpdateGroupProperty({ groupId: group.groupId, dayOptions: group.dayOptions });
}

/**
 * Endpoint to send a chat message to a group
 */
export async function chatPost(params: ChatPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      onlyIfAMemberHasUserId: user.userId,
      includeFullDetails: true,
      ctx,
   });

   group.chat.messages.push({
      chatMessageId: uuidv1(),
      messageText: params.message,
      time: moment().unix(),
      authorUserId: user.userId,
   });
   group.chat.usersDownloadedLastMessage = [];

   await queryToUpdateGroupProperty({ groupId: group.groupId, chat: group.chat });
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
      group.chat.usersDownloadedLastMessage.length === group.members.length &&
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

export function getAllSlotsNames(): string[] {
   const result: string[] = [];
   for (let i = 0; i < GROUP_SLOTS_CONFIGS.length; i++) {
      result.push('slot' + i);
   }
   return result;
}

interface GetGroupByIdOptions {
   includeFullDetails?: boolean;
   onlyIfAMemberHasUserId?: string;
   protectPrivacy?: boolean;
   ctx?: BaseContext;
}
