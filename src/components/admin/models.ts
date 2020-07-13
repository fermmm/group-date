import { BaseContext } from 'koa';
import * as moment from 'moment';
import { v1 as uuidv1 } from 'uuid';
import {
   queryToChatWithAdmins,
   queryToChatWithAdminsList,
} from '../../common-tools/database-tools/data-conversion-tools';
import {
   AdminChatGetAllParams,
   AdminChatGetParams,
   AdminChatPostParams,
   AdminConvertPostParams,
   ChatWithAdmins,
} from '../../shared-tools/endpoints-interfaces/admin';
import { ChatMessage } from '../../shared-tools/endpoints-interfaces/common';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retrieveUser } from '../common/models';
import { updateUserProps } from '../common/queries';
import { getAdminChatMessages, getAllChatsWithAdmins, saveAdminChatMessage } from './queries';

export async function adminChatGet(params: AdminChatGetParams, ctx: BaseContext): Promise<ChatWithAdmins> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   const nonAdminUserId: string = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
   const result: ChatWithAdmins = await queryToChatWithAdmins(
      getAdminChatMessages(nonAdminUserId, callerUser.isAdmin),
   );
   return result;
}

export async function adminChatPost(params: AdminChatPostParams, ctx: BaseContext): Promise<void> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   const nonAdminUserId: string = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
   const currentChat: ChatMessage[] =
      (await queryToChatWithAdmins(getAdminChatMessages(nonAdminUserId, false)))?.messages || [];

   currentChat.push({
      messageText: params.messageText,
      chatMessageId: uuidv1(),
      time: moment().unix(),
      authorUserId: callerUser.isAdmin ? '' : callerUser.userId,
   });

   await saveAdminChatMessage(nonAdminUserId, currentChat, callerUser.isAdmin || false).iterate();
}

export async function allChatsWithAdminsGet(
   params: AdminChatGetAllParams,
   ctx: BaseContext,
): Promise<ChatWithAdmins[]> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   if (!callerUser.isAdmin) {
      return null;
   }

   return queryToChatWithAdminsList(getAllChatsWithAdmins(params.excludeRespondedByAdmin));
}

export async function convertToAdminPost(params: AdminConvertPostParams, ctx: BaseContext): Promise<void> {
   const userRequesting: Partial<User> = await retrieveUser(params.token, false, ctx);
   if (!userRequesting.isAdmin) {
      return;
   }
   const targetUser: Partial<User> = await retrieveUser(params.targetUserToken, false, ctx);
   return convertToAdmin(targetUser.token);
}

export async function convertToAdmin(token: string): Promise<void> {
   await updateUserProps(token, [{ key: 'isAdmin', value: true }]);
}
