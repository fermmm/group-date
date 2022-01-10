import { BaseContext, ParameterizedContext, Next } from "koa";
import * as moment from "moment";
import * as fs from "fs";
import { setIntervalAsync } from "set-interval-async/dynamic";
import * as appRoot from "app-root-path";
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
   BanUserPostParams,
   ChatWithAdmins,
   CredentialsValidationResult,
   DatabaseContentFileFormat,
   ExportDatabaseGetParams,
   ExportDatabaseResponse,
   ImportDatabasePostParams,
   RemoveAllBanReasonsFromUserPostParams,
   RemoveBanFromUserPostParams,
   SendEmailPostParams,
   UsageReport,
   VisualizerQueryParams,
} from "../../shared-tools/endpoints-interfaces/admin";
import { ChatMessage, TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import {
   AttractionType,
   NotificationChannelId,
   NotificationData,
   NotificationType,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveUser, setAttractionPost } from "../user/models";
import {
   queryToGetAllCompleteUsers,
   queryToGetAllUsers,
   queryToGetUserByEmail,
   queryToGetUserById,
   queryToSetAttraction,
   queryToUpdateUserProps,
   queryToUpdateUserToken,
} from "../user/queries";
import {
   queryToGetAdminChatMessages,
   queryToGetAllChatsWithAdmins,
   queryToSaveAdminChatMessage,
   queryToSelectUsersForNotification,
} from "./queries";
import { fromQueryToChatWithAdmins, fromQueryToChatWithAdminsList } from "./tools/data-conversion";
import { generateId } from "../../common-tools/string-tools/string-tools";
import {
   databaseUrl,
   importDatabaseContentFromQueryFile,
   sendQuery,
} from "../../common-tools/database-tools/database-manager";
import { queryToGetAllGroups } from "../groups/queries";
import { queryToGetGroupsReceivingMoreUsers } from "../groups-finder/queries";
import { DEMO_ACCOUNTS, GROUP_SLOTS_CONFIGS, LOG_USAGE_REPORT_FREQUENCY } from "../../configurations";
import { GroupQuality } from "../groups-finder/tools/types";
import { validateAdminCredentials } from "./tools/validateAdminCredentials";
import { makeQuery, nodesToJson } from "../../common-tools/database-tools/visualizer-proxy-tools";
import { createFolder } from "../../common-tools/files-tools/files-tools";
import { uploadFileToS3 } from "../../common-tools/aws/s3-tools";
import { fromQueryToUser, fromQueryToUserList } from "../user/tools/data-conversion";
import {
   getNotificationsDeliveryErrors,
   sendPushNotifications,
} from "../../common-tools/push-notifications/push-notifications";
import { time } from "../../common-tools/js-tools/js-tools";
import { executeSystemCommand, isProductionMode } from "../../common-tools/process/process-tools";
import { exportDatabaseContent, importDatabaseContentFromCsv } from "../../common-tools/aws/neptune-tools";
import { sendEmailUsingSES } from "../../common-tools/aws/ses-tools";
import { tryToGetErrorMessage } from "../../common-tools/httpRequest/tools/tryToGetErrorMessage";
import { createFakeUser } from "../../tests/tools/users";
import { createEmailLoginToken } from "../email-login/models";
import { createGroup, getSlotIdFromUsersAmount } from "../groups/models";
import koaBody = require("koa-body");

/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
export async function initializeAdmin(): Promise<void> {
   createFolder("admin-uploads");
   setIntervalAsync(logUsageReport, LOG_USAGE_REPORT_FREQUENCY);
   // To create a report when server boots and preview database:
   logUsageReport();
   await createDemoAccounts();
}

export async function validateCredentialsGet(
   params: AdminProtectionParams,
   ctx: BaseContext,
): Promise<CredentialsValidationResult> {
   return await validateAdminCredentials(params);
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
   const passwordValidation = await validateAdminCredentials(params);
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
   const { fileName } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return null;
   }

   let resolvePromise: (value: string | PromiseLike<string>) => void;
   const promise = new Promise<string>(resolve => (resolvePromise = resolve));

   fs.readFile("./logs/" + fileName, { encoding: "utf-8" }, function (err, data) {
      if (!err) {
         resolvePromise(data);
      } else {
         ctx.throw(400, err);
      }
   });

   return promise;
}

export async function importDatabasePost(params: ImportDatabasePostParams, ctx: BaseContext) {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   if (params.format === DatabaseContentFileFormat.NeptuneCsv) {
      if (process.env.USING_AWS === "true" && isProductionMode()) {
         return await importDatabaseContentFromCsv(params, ctx);
      } else {
         ctx.throw(
            400,
            "Error: Importing Neptune CSV files only works when running on AWS (in production mode) and when USING_AWS = true",
         );
         return;
      }
   }

   if (params.format === DatabaseContentFileFormat.GremlinQuery) {
      return await importDatabaseContentFromQueryFile(params.fileNames);
   }
}

export async function exportDatabaseGet(
   params: ExportDatabaseGetParams,
   ctx: BaseContext,
): Promise<ExportDatabaseResponse> {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   if (process.env.USING_AWS === "true") {
      return await exportDatabaseContent(ctx);
   }
}

export async function visualizerPost(params: VisualizerQueryParams, ctx: BaseContext) {
   const { query, nodeLimit } = params;

   const passwordValidation = await validateAdminCredentials(params);
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
   const passwordValidation = await validateAdminCredentials(ctx.request.query);
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
   }

   // In the following code it's configured how the file is saved.

   const uploadDirRelative = `/admin-uploads/${ctx.request.query?.folder ?? ""}`;
   const uploadDir = path.join(appRoot.path, uploadDirRelative);
   createFolder(uploadDirRelative);

   return koaBody({
      multipart: true,
      formidable: {
         uploadDir,
         onFileBegin: (name, file) => {
            file.path = `${uploadDir}/${file.name}`;
         },
         keepExtensions: true,
      },
      onError: (error, ctx) => {
         ctx.throw(400, error);
      },
   })(ctx, next);
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

      const absoluteFolderPath: string = path.dirname(file.path);
      const folderPath = path.relative(appRoot.path, absoluteFolderPath) + "/";
      const fileName: string = path.basename(file.path);

      if (process.env.USING_AWS === "true" && isProductionMode()) {
         const fileNameInS3 = await uploadFileToS3({
            fileName: folderPath + fileName,
            targetPath: fileName,
         });

         // Remove the file from the server because it's already on the S3
         await fs.promises.unlink(file.path);

         fileNames.push(fileNameInS3);
      } else {
         fileNames.push(folderPath + fileName);
      }
   }

   return { fileNames };
}

export async function adminNotificationSendPost(params: AdminNotificationPostParams, ctx: BaseContext) {
   const { channelId, onlyReturnUsersAmount, filters, notificationContent, sendEmailNotification } = params;

   const passwordValidation = await validateAdminCredentials(params);
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
         sendEmailNotification,
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
   const { command } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   return await executeSystemCommand(command);
}

export async function banUserPost(params: BanUserPostParams, ctx?: BaseContext) {
   const { userId, reason } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx?.throw(passwordValidation.error);
      return;
   }

   const user = await fromQueryToUser(queryToGetUserById(userId), false);

   if (!user) {
      ctx?.throw(404, "User not found");
      return;
   }

   if (user.banReasons?.includes(reason)) {
      ctx?.throw(400, "User already banned for this reason");
      return;
   }

   await sendQuery(() =>
      queryToGetUserById(userId)
         .property("banReasons", JSON.stringify([...(user.banReasons ?? []), reason]))
         .property("banReasonsAmount", user.banReasonsAmount != null ? user.banReasonsAmount + 1 : 1)
         .iterate(),
   );

   return { success: true };
}

export async function removeBanFromUserPost(params: RemoveBanFromUserPostParams, ctx?: BaseContext) {
   const { userId, reason } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx?.throw(passwordValidation.error);
      return;
   }

   const user = await fromQueryToUser(queryToGetUserById(userId), false);

   if (!user) {
      ctx?.throw(404, "User not found");
      return;
   }

   if (user.banReasons == null || !user.banReasons.includes(reason)) {
      ctx?.throw(400, "User doesn't have this ban reason");
      return;
   }

   const newBanReasonsList = user.banReasons.filter(banReason => banReason !== reason);
   const newBanReasonsAmount = newBanReasonsList.length;

   await sendQuery(() =>
      queryToGetUserById(userId)
         .property("banReasons", JSON.stringify(newBanReasonsList))
         .property("banReasonsAmount", newBanReasonsAmount)
         .iterate(),
   );

   return { success: true };
}

export async function removeAllBanReasonsFromUser(
   params: RemoveAllBanReasonsFromUserPostParams,
   ctx?: BaseContext,
) {
   const { userId } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx?.throw(passwordValidation.error);
      return;
   }

   const user = await fromQueryToUser(queryToGetUserById(userId), false);

   if (!user) {
      ctx?.throw(404, "User not found");
      return;
   }

   if (user.banReasonsAmount == null || user.banReasonsAmount === 0) {
      ctx?.throw(400, "User doesn't have any ban reasons");
      return;
   }

   await sendQuery(() =>
      queryToGetUserById(userId)
         .property("banReasons", JSON.stringify([]))
         .property("banReasonsAmount", 0)
         .iterate(),
   );

   return { success: true };
}

export async function sendEmailPost(params: SendEmailPostParams, ctx: BaseContext) {
   const { to, subject, text } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   try {
      return await sendEmailUsingSES({ to, subject, text });
   } catch (error) {
      return tryToGetErrorMessage(error);
   }
}

async function createDemoAccounts() {
   const usersCreated: User[] = [];

   // Create the users
   for (const demoProps of DEMO_ACCOUNTS) {
      const user = await fromQueryToUser(queryToGetUserByEmail(demoProps.email), false);
      if (user) {
         return;
      }
      const token = createEmailLoginToken({ email: demoProps.email, password: demoProps.password });
      const demoUser = await createFakeUser({
         ...demoProps,
         token,
         language: "es",
      });
      usersCreated.push(demoUser);
   }
   // They should like each other to not bug the group interface
   for (const user of usersCreated) {
      const otherUsers = usersCreated.filter(u => u.userId !== user.userId);

      await sendQuery(() =>
         queryToSetAttraction({
            token: user.token,
            attractions: otherUsers.map(userToConnect => ({
               userId: userToConnect.userId,
               attractionType: AttractionType.Like,
            })),
         }).iterate(),
      );
   }

   // Put them in a demo group
   await createGroup(
      {
         usersIds: usersCreated.map(u => u.userId),
         slotToUse: getSlotIdFromUsersAmount(usersCreated.length),
      },
      null,
      true,
   );

   /*
    * Set the demoAccount property to true for the users. This should be the last thing executed because setting
    * this disables some functionality that we are using on the lines above.
    */
   for (const demoProps of DEMO_ACCOUNTS) {
      await sendQuery(() => queryToGetUserByEmail(demoProps.email).property("demoAccount", true).iterate());
   }
}
