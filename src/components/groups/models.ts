import { BaseContext } from 'koa';
import * as moment from 'moment';
import { v1 as uuidv1 } from 'uuid';
import { valueMap } from '../../common-tools/database-tools/common-queries';
import { queryToGroup, queryToGroupList } from '../../common-tools/database-tools/data-convertion-tools';
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
import { retrieveFullyRegisteredUser } from '../common/models';
import {
   addDateIdeaToGroup,
   addMembersToGroupTraversal,
   addUserToGroup,
   getGroupsOfUserById,
   getGroupTraversalById,
   queryToCreateGroup,
   updateGroup,
} from './queries';

const MAX_CHAT_MESSAGES_STORED_ON_SERVER = 15;
const MAX_WEEKEND_DAYS_VOTE_OPTIONS = 12;

/**
 * Endpoints to get a specific group that the user is part of.
 * This endpoint is also used to download the chat messages so also interacts with the
 * message read functionality.
 */
export async function groupGet(params: BasicGroupParams, ctx: BaseContext): Promise<Group> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      onlyIfAMemberHasUserId: user.userId,
      includeMembersList: true,
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

   return queryToGroupList(addMembersToGroupTraversal(getGroupsOfUserById(user.userId)));
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
   await updateGroup({ groupId: group.groupId, usersThatAccepted: group.usersThatAccepted });
}

/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
export async function dateIdeaVotePost(params: DateIdeaVotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, { onlyIfAMemberHasUserId: user.userId, ctx });

   for (const dateIdea of group.dateIdeas) {
      const userIsVotingThisOption: boolean =
         params.ideasToVoteAuthorsIds.indexOf(dateIdea.authorUserId) !== -1;
      const userIdPosOnVotes: number = dateIdea.votersUserId.indexOf(user.userId);
      const optionAlreadyVoted: boolean = userIdPosOnVotes !== -1;

      if (userIsVotingThisOption) {
         if (!optionAlreadyVoted) {
            dateIdea.votersUserId.push(user.userId);
         }
      } else {
         // Remove the user vote if it is there from a previous api call
         if (optionAlreadyVoted) {
            dateIdea.votersUserId.splice(userIdPosOnVotes, 1);
         }
      }
   }

   await updateGroup({ groupId: group.groupId, dateIdeas: group.dateIdeas });
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

   await updateGroup({ groupId: group.groupId, dayOptions: group.dayOptions });
}

/**
 * Endpoint to send a chat message to a group
 */
export async function chatPost(params: ChatPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, {
      onlyIfAMemberHasUserId: user.userId,
      includeMembersList: true,
      ctx,
   });

   group.chat.messages.push({
      chatMessageId: uuidv1(),
      messageText: params.message,
      time: moment().unix(),
      authorUserId: user.userId,
   });
   group.chat.usersDownloadedLastMessage = [];

   await updateGroup({ groupId: group.groupId, chat: group.chat });
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

      await updateGroup({ groupId: group.groupId, feedback: group.feedback });
   }
}

/**
 * Internal function to create a group (this is not an endpoint)
 */
export async function createGroup(protectPrivacy: boolean = true): Promise<Group> {
   const dayOptions: DayOption[] = getComingWeekendDays(MAX_WEEKEND_DAYS_VOTE_OPTIONS ?? 12).map(date => ({
      date,
      votersUserId: [],
   }));
   return queryToGroup(valueMap(queryToCreateGroup(dayOptions)), protectPrivacy);
}

/**
 * Internal function to get a group by Id
 */
export async function getGroupById(
   groupId: string,
   { includeMembersList = false, protectPrivacy = true, onlyIfAMemberHasUserId, ctx }: GetGroupByIdOptions = {},
): Promise<Group> {
   let traversal = getGroupTraversalById(groupId, onlyIfAMemberHasUserId);

   if (includeMembersList) {
      traversal = addMembersToGroupTraversal(traversal);
   } else {
      traversal = valueMap(traversal);
   }

   const result: Group = await queryToGroup(traversal, protectPrivacy);

   if (result == null && ctx != null) {
      ctx.throw(400, 'Group not found');
   }

   return result;
}

/**
 * Internal function to add a user to a group
 */
export async function addUsersToGroup(users: User[], groupId: string): Promise<void> {
   let group = await getGroupById(groupId);

   for (const user of users) {
      await addUserToGroup(user, group);
      await addDateIdeaToGroup(group, {
         description: user.dateIdeaName,
         address: user.dateIdeaAddress,
         authorUserId: user.userId,
         votersUserId: [],
      });

      // Update the group data to be able to manipulate arrays in the next for loop iteration
      group = await getGroupById(groupId);
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
      group.chat.usersDownloadedLastMessage.length === group.members.length &&
      group.chat.messages.length > MAX_CHAT_MESSAGES_STORED_ON_SERVER
   ) {
      // Remove all chat messages except for the last ones to optimize data transfer next time
      group.chat.messages = group.chat.messages.slice(-1 * MAX_CHAT_MESSAGES_STORED_ON_SERVER);
      updateChanges = true;
   }

   if (updateChanges) {
      await updateGroup({ groupId: group.groupId, chat: group.chat });
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

interface GetGroupByIdOptions {
   includeMembersList?: boolean;
   onlyIfAMemberHasUserId?: string;
   protectPrivacy?: boolean;
   ctx?: BaseContext;
}
