import { BaseContext } from 'koa';
import * as moment from 'moment';
import { v1 as uuidv1 } from 'uuid';
import { queryToGroup, valueMap } from '../../common-tools/database-tools/data-convertion-tools';
import {
   BasicGroupParams,
   ChatPostParams,
   FeedbackPostParams,
   Group,
   VotePostParams,
} from '../../shared-tools/endpoints-interfaces/groups';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retreiveCompleteUser } from '../common/models';
import {
   addDateIdeaToGroup,
   addMembersToGroupTraversal,
   addUserToGroup,
   finishGroupTraversal,
   getGroupTraversalById,
   queryToCreateGroup,
   updateGroup,
} from './queries';

const MAX_CHAT_MESSAGES_STORED_ON_SERVER = 15;
/**
 * TODO: Crear un endpoint en user que devuelve todos los grupos de un usuario
 * TODO: Hacer un filtro de props de privacidad sensible para las props de los
 * usuarios del group y para el feedback del group
 */

/**
 * This endpoint is also uses to download the chat meesages so also interacts with the
 * message readed functionality.
 */
export async function groupGet(params: BasicGroupParams, ctx: BaseContext): Promise<Group> {
   const user: User = await retreiveCompleteUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, true);
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

   return group;
}

export async function acceptPost(params: BasicGroupParams, ctx: BaseContext): Promise<void> {
   const user: User = await retreiveCompleteUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, false);
   if (group.usersThatAccepted.indexOf(user.userId) === -1) {
      group.usersThatAccepted.push(user.userId);
   }
   await updateGroup({ groupId: group.groupId, usersThatAccepted: group.usersThatAccepted });
}

export async function votePost(params: VotePostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retreiveCompleteUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, false);
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
   const user: User = await retreiveCompleteUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, false);
   group.chat.messages.push({
      chatMessageId: uuidv1(),
      message: params.message,
      time: moment().unix(),
      authorUserId: user.userId,
   });
   group.chat.usersDownloadedLastMessage = [];

   await updateGroup({ groupId: group.groupId, chat: group.chat });
}

export async function feedbackPost(params: FeedbackPostParams, ctx: BaseContext): Promise<void> {
   const user: User = await retreiveCompleteUser(params.token, false, ctx);
   const group: Group = await getGroupById(params.groupId, false);
   if (group.feedback.find(f => f.userId === user.userId) == null) {
      group.feedback.push({
         userId: user.userId,
         feedbackType: params.feedback.feedbackType,
         description: params.feedback.description,
      });

      await updateGroup({ groupId: group.groupId, feedback: group.feedback });
   }
}

export async function createGroup(): Promise<Group> {
   return queryToGroup(finishGroupTraversal(queryToCreateGroup()));
}

export async function getGroupById(groupId: string, includeMembersData: boolean): Promise<Group> {
   if (includeMembersData) {
      return queryToGroup(addMembersToGroupTraversal(getGroupTraversalById(groupId)));
   }

   return queryToGroup(valueMap(getGroupTraversalById(groupId)));
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

      // Update the group data to be able to manipulate arrays again
      group = await getGroupById(group.groupId, false);
   }
}
