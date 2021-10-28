import { BaseContext, ParameterizedContext, Next } from "koa";
import * as moment from "moment";
import * as fs from "fs";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { performance } from "perf_hooks";
import * as path from "path";
import * as gremlin from "gremlin";
import { Files, File } from "formidable";
import {
   AdminChatGetAllParams,
   AdminChatGetParams,
   AdminChatPostParams,
   AdminCommandPostParams,
   AdminConvertPostParams,
   AdminLogGetParams,
   AdminNotificationPostParams,
   AdminProtectionParams,
   ChatWithAdmins,
   CredentialsValidationResult,
   ExportDatabaseGetParams,
   ExportDatabaseResponse,
   ImportDatabasePostParams,
   UsageReport,
   VisualizerQueryParams,
} from "../../shared-tools/endpoints-interfaces/admin";
import { ChatMessage, TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import {
   NotificationChannelId,
   NotificationData,
   NotificationType,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveUser } from "../user/models";
import { queryToGetAllCompleteUsers, queryToGetAllUsers, queryToUpdateUserProps } from "../user/queries";
import {
   queryToGetAdminChatMessages,
   queryToGetAllChatsWithAdmins,
   queryToSaveAdminChatMessage,
   queryToSelectUsersForNotification,
} from "./queries";
import { fromQueryToChatWithAdmins, fromQueryToChatWithAdminsList } from "./tools/data-conversion";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { databaseUrl, sendQuery } from "../../common-tools/database-tools/database-manager";
import { queryToGetAllGroups } from "../groups/queries";
import { queryToGetGroupsReceivingMoreUsers } from "../groups-finder/queries";
import { GROUP_SLOTS_CONFIGS, LOG_USAGE_REPORT_FREQUENCY } from "../../configurations";
import { GroupQuality } from "../groups-finder/tools/types";
import { validateAdminCredentials } from "./tools/validateAdminCredentials";
import { httpRequest } from "../../common-tools/httpRequest/httpRequest";
import { makeQuery, nodesToJson } from "../../common-tools/database-tools/visualizer-proxy-tools";
import { fileSaverForAdminFiles } from "../../common-tools/koa-tools/koa-tools";
import { createFolder } from "../../common-tools/files-tools/files-tools";
import { uploadFileToS3 } from "../../common-tools/aws/s3-tools";
import { fromQueryToUserList } from "../user/tools/data-conversion";
import {
   getNotificationsDeliveryErrors,
   sendPushNotifications,
} from "../../common-tools/push-notifications/push-notifications";
import { time } from "../../common-tools/js-tools/js-tools";
import { executeSystemCommand } from "../../common-tools/process/process-tools";
import { exportNeptuneDatabase, importNeptuneDatabase } from "../../common-tools/aws/neptune.tools";

/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
export async function initializeAdmin(): Promise<void> {
   createFolder("admin-uploads");
   await updateAmountOfUsersCount();
   setIntervalAsync(logUsageReport, LOG_USAGE_REPORT_FREQUENCY);
   // To create a report when server boots and preview database:
   logUsageReport();
}

export async function validateCredentialsGet(
   params: AdminProtectionParams,
   ctx: BaseContext,
): Promise<CredentialsValidationResult> {
   return validateAdminCredentials(params);
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
      amountOfUsers: amountOfFullyRegisteredUsers,
      incompleteUsers,
      amountOfGroups,
      totalOpenGroups,
      openGroupsBySlot,
      timeSpentOnReportMs,
   };

   logToFile(JSON.stringify(report), "usageReports");
}

export async function logFileListGet(params: AdminProtectionParams, ctx: BaseContext): Promise<string[]> {
   const { user, password } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
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
   const { user, password, fileName } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
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

export async function importDatabasePost(params: ImportDatabasePostParams, ctx: BaseContext) {
   const { user, password } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   if (process.env.USING_AWS === "true") {
      return await importNeptuneDatabase(params, ctx);
   }
}

export async function exportDatabaseGet(
   params: ExportDatabaseGetParams,
   ctx: BaseContext,
): Promise<ExportDatabaseResponse> {
   const { user, password } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   if (process.env.USING_AWS === "true") {
      return await exportNeptuneDatabase(ctx);
   }
}

export async function visualizerPost(params: VisualizerQueryParams, ctx: BaseContext) {
   const { user, password, query, nodeLimit } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   const client = new gremlin.driver.Client(databaseUrl, {
      traversalSource: "g",
      mimeType: "application/json",
   });
   const result = await client.submit(makeQuery(query, nodeLimit), {});
   return nodesToJson(result._items);
}

export async function onAdminFileReceived(ctx: ParameterizedContext<{}, {}>, next: Next): Promise<any> {
   const { user, password } = ctx.request.query as NodeJS.Dict<string>;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
   }

   return fileSaverForAdminFiles(ctx, next);
}

export async function onAdminFileSaved(
   files: Files | undefined,
   ctx: BaseContext,
): Promise<{ fileNames: string[] }> {
   const fileNames: string[] = [];
   for (const fileKeyName of Object.keys(files)) {
      const file: File = files[fileKeyName] as File;

      if (file == null || file.size === 0) {
         if (file) {
            fs.unlinkSync(file.path);
         }
         ctx.throw(400, "Invalid file provided", { ctx });
         return;
      }

      const folderPath: string = path.dirname(file.path);
      const fileName: string = path.basename(file.path);

      if (process.env.USING_AWS === "true") {
         const fileNameInS3 = await uploadFileToS3({
            fileName: folderPath + fileName,
            targetPath: fileName,
         });

         // Remove the file from the server because it's already on the S3
         await fs.promises.unlink(folderPath + fileName);

         fileNames.push(fileNameInS3);
      } else {
         fileNames.push(fileName);
      }
   }

   return { fileNames: fileNames };
}

export async function adminNotificationSendPost(params: AdminNotificationPostParams, ctx: BaseContext) {
   const { user, password, channelId, onlyReturnUsersAmount, filters, notificationContent } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   const users = await fromQueryToUserList(queryToSelectUsersForNotification(filters), false, false);

   if (onlyReturnUsersAmount) {
      return `If you send the notification ${users.length} user(s) will receive it.`;
   }

   for (const user of users) {
      await addNotificationToUser({ token: user.token }, notificationContent, {
         translateNotification: false,
         sendPushNotification: false,
         channelId,
      });
   }

   const expoPushTickets = await sendPushNotifications(
      users.map(user => ({
         to: user.notificationsToken,
         title: notificationContent.title,
         body: notificationContent.text,
         data: {
            type: notificationContent.type,
            targetId: notificationContent.targetId,
            notificationId: generateId(),
         } as NotificationData,
         channelId: channelId ? channelId : NotificationChannelId.Default,
      })),
   );

   // Some time to wait in order for expo to process the notification before the delivery status can be checked
   await time(10000);

   const errors = await getNotificationsDeliveryErrors(expoPushTickets);

   let returnMessage = `Notification sent to ${users.length - errors.length} users.`;
   if (errors.length > 0) {
      returnMessage += ` ${errors.length} user(s) didn't receive the notification probably because uninstalled the app or disabled notifications, this is the delivery status report of those failed notifications:`;
      errors.forEach(error => (returnMessage += `\n${error}`));
   }

   return returnMessage;
}

// Runs a system command and return output
export async function runCommandPost(params: AdminCommandPostParams, ctx: BaseContext): Promise<string> {
   const { user, password, command } = params;

   const passwordValidation = validateAdminCredentials({ user, password });
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   return await executeSystemCommand(command);
}
