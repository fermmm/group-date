import { BaseContext } from 'koa';
import * as moment from 'moment';
import { v1 as uuidv1 } from 'uuid';
import { valueMap } from '../../common-tools/database-tools/common-queries';
import { queryToGroup, queryToGroupList } from '../../common-tools/database-tools/data-convertion-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import {
   BasicGroupParams,
   ChatPostParams,
   FeedbackPostParams,
   Group,
   VotePostParams,
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

/**
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

export async function userGroupsGet(params: TokenParameter, ctx: BaseContext): Promise<Group[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   return queryToGroupList(addMembersToGroupTraversal(getGroupsOfUserById(user.userId)));
}

export async function acceptPost(params: BasicGroupParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, { onlyIfAMemberHasUserId: user.userId, ctx });

   if (group.usersThatAccepted.indexOf(user.userId) === -1) {
      group.usersThatAccepted.push(user.userId);
   }
   await updateGroup({ groupId: group.groupId, usersThatAccepted: group.usersThatAccepted });
}

export async function votePost(params: VotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, { onlyIfAMemberHasUserId: user.userId, ctx });

   for (const dateIdea of group.dateIdeas) {
      const userIdPosOnVotes = dateIdea.votersUserId.indexOf(user.userId);
      // If the date idea of the group is one of the user votes from params:
      if (params.votedIdeasAuthorsIds.indexOf(dateIdea.authorUserId) !== -1) {
         // Add the user vote to the list if it's not there already
         if (userIdPosOnVotes === -1) {
            dateIdea.votersUserId.push(user.userId);
         }
      } else {
         // Else remove the user vote if it is there
         if (userIdPosOnVotes !== -1) {
            dateIdea.votersUserId.splice(userIdPosOnVotes, 1);
         }
      }
   }

   await updateGroup({ groupId: group.groupId, dateIdeas: group.dateIdeas });
}

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

export async function createGroup(protectPrivacy: boolean = true): Promise<Group> {
   return queryToGroup(valueMap(queryToCreateGroup()), protectPrivacy);
}

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

export async function addUsersToGroup(users: User[], group: Group): Promise<void> {
   for (const user of users) {
      await addUserToGroup(user, group);
      await addDateIdeaToGroup(group, {
         description: user.dateIdeaName,
         address: user.dateIdeaAddress,
         authorUserId: user.userId,
         votersUserId: [],
      });

      // Update the group data to be able to manipulate arrays in the next for loop iteration
      group = await getGroupById(group.groupId);
   }
}

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

interface GetGroupByIdOptions {
   includeMembersList?: boolean;
   onlyIfAMemberHasUserId?: string;
   protectPrivacy?: boolean;
   ctx?: BaseContext;
}
