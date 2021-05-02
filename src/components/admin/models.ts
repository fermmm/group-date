import { BaseContext } from "koa";
import * as moment from "moment";
import * as fs from "fs";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { performance } from "perf_hooks";
import {
   AdminChatGetAllParams,
   AdminChatGetParams,
   AdminChatPostParams,
   AdminConvertPostParams,
   AdminLogGetParams,
   AdminNotificationPostParams,
   ChatWithAdmins,
   UsageReport,
} from "../../shared-tools/endpoints-interfaces/admin";
import { ChatMessage, TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { NotificationType, User } from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveUser } from "../user/models";
import { queryToGetAllCompleteUsers, queryToGetAllUsers, queryToUpdateUserProps } from "../user/queries";
import {
   queryToGetAdminChatMessages,
   queryToGetAllChatsWithAdmins,
   queryToSaveAdminChatMessage,
} from "./queries";
import { fromQueryToChatWithAdmins, fromQueryToChatWithAdminsList } from "./tools/data-conversion";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { sendQuery } from "../../common-tools/database-tools/database-manager";
import { queryToGetAllGroups } from "../groups/queries";
import { queryToGetGroupsReceivingMoreUsers } from "../groups-finder/queries";
import { GROUP_SLOTS_CONFIGS, LOG_USAGE_REPORT_FREQUENCY } from "../../configurations";
import { GroupQuality } from "../groups-finder/tools/types";

/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
export async function initializeAdmin(): Promise<void> {
   await updateAmountOfUsersCount();
   setIntervalAsync(logUsageReport, LOG_USAGE_REPORT_FREQUENCY);
   // To create a report when server boots and preview database:
   logUsageReport();
}

export async function adminChatGet(params: AdminChatGetParams, ctx: BaseContext): Promise<ChatWithAdmins> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   const nonAdminUserId: string = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
   const result: ChatWithAdmins = await fromQueryToChatWithAdmins(
      queryToGetAdminChatMessages(nonAdminUserId, callerUser.isAdmin),
   );
   return result;
}

export async function adminChatPost(params: AdminChatPostParams, ctx: BaseContext): Promise<void> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   const nonAdminUserId: string = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
   const currentChat: ChatMessage[] =
      (await fromQueryToChatWithAdmins(queryToGetAdminChatMessages(nonAdminUserId, false)))?.messages || [];

   currentChat.push({
      messageText: params.messageText,
      chatMessageId: generateId(),
      time: moment().unix(),
      authorUserId: callerUser.isAdmin ? "" : callerUser.userId,
   });

   await queryToSaveAdminChatMessage(nonAdminUserId, currentChat, callerUser.isAdmin || false).iterate();

   if (callerUser.isAdmin) {
      await addNotificationToUser(
         { userId: params.targetUserId },
         {
            type: NotificationType.ContactChat,
            title: "You have a new message from an admin",
            text: "You can respond to the admin",
         },
         { sendPushNotification: true, translateNotification: true },
      );
   }
}

export async function allChatsWithAdminsGet(
   params: AdminChatGetAllParams,
   ctx: BaseContext,
): Promise<ChatWithAdmins[]> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   if (!callerUser.isAdmin) {
      return null;
   }

   return fromQueryToChatWithAdminsList(queryToGetAllChatsWithAdmins(params.excludeRespondedByAdmin));
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
   await queryToUpdateUserProps(token, [{ key: "isAdmin", value: true }]);
}

let amountOfUsersCount: number = null;
export async function updateAmountOfUsersCount(): Promise<void> {
   amountOfUsersCount = (await sendQuery(() => queryToGetAllUsers().count().next())).value;
}

export function getAmountOfUsersCount(): number {
   return amountOfUsersCount;
}

export async function logUsageReport(): Promise<void> {
   const timeStart = performance.now();

   const amountOfUsers = (await sendQuery(() => queryToGetAllUsers().count().next())).value;
   const amountOfFullyRegisteredUsers = (await sendQuery(() => queryToGetAllCompleteUsers().count().next()))
      .value;
   const incompleteUsers = amountOfUsers - amountOfFullyRegisteredUsers;
   const amountOfGroups = (await sendQuery(() => queryToGetAllGroups().count().next())).value;
   let totalOpenGroups = 0;
   const openGroupsBySlot: number[] = [];

   for (let i = 0; i < GROUP_SLOTS_CONFIGS.length; i++) {
      const amount = (await queryToGetGroupsReceivingMoreUsers(i, GroupQuality.Good).toList()).length;
      openGroupsBySlot.push(amount);
      totalOpenGroups += amount;
   }

   const timeSpentOnReportMs = Math.round(performance.now() - timeStart);

   const report: UsageReport = {
      amountOfUsers,
      incompleteUsers,
      amountOfGroups,
      totalOpenGroups,
      openGroupsBySlot,
      timeSpentOnReportMs,
   };

   logToFile(JSON.stringify(report), "usageReports");
}

export async function logFileListGet(params: TokenParameter, ctx: BaseContext): Promise<string[]> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);

   if (!callerUser.isAdmin) {
      return null;
   }

   let resolvePromise: (value: string[] | PromiseLike<string[]>) => void;
   const promise = new Promise<string[]>(resolve => (resolvePromise = resolve));

   fs.readdir("./logs/", (err, files) => {
      resolvePromise(files.map(file => file));
   });

   return promise;
}

export async function logGet(params: AdminLogGetParams, ctx: BaseContext): Promise<string> {
   const { token, fileName } = params;

   const callerUser: Partial<User> = await retrieveUser(token, false, ctx);
   if (!callerUser.isAdmin) {
      return null;
   }

   let resolvePromise: (value: string | PromiseLike<string>) => void;
   const promise = new Promise<string>(resolve => (resolvePromise = resolve));

   fs.readFile("./logs/" + fileName, { encoding: "utf-8" }, function (err, data) {
      if (!err) {
         resolvePromise(data);
      } else {
         ctx.throw(err);
      }
   });

   return promise;
}

/**
 * This endpoint can be extended to search users by user props and other options so many users can be reached.
 * To implement events notifications this endpoint must be extended.
 */
export async function adminNotificationPost(
   params: AdminNotificationPostParams,
   ctx: BaseContext,
): Promise<ChatWithAdmins[]> {
   const callerUser: Partial<User> = await retrieveUser(params.token, false, ctx);
   if (!callerUser.isAdmin) {
      return null;
   }

   await addNotificationToUser({ userId: params.targetUserId }, params.notification, {
      sendPushNotification: true,
      translateNotification: false,
      channelId: params.channelId,
   });
}
