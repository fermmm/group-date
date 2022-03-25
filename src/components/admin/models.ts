import { BaseContext, ParameterizedContext, Next } from "koa";
import * as moment from "moment";
import * as fs from "fs";
import { setIntervalAsync } from "set-interval-async/dynamic";
import * as appRoot from "app-root-path";
import { performance } from "perf_hooks";
import * as path from "path";
import { Files, File } from "formidable";
import {
   AdminChatGetAllParams,
   AdminChatGetParams,
   AdminChatPostParams,
   AdminCodePostParams,
   AdminCommandPostParams,
   AdminConvertPostParams,
   AdminDeleteLogEntryParams,
   AdminGroupGetParams,
   AdminLogGetParams,
   AdminNotificationPostParams,
   AdminNotificationStatusGet,
   AdminProtectionParams,
   AdminQueryParams,
   AdminQueryResponse,
   BanUserPostParams,
   ChatWithAdmins,
   CredentialsValidationResult,
   DatabaseContentFileFormat,
   ExportDatabaseGetParams,
   ExportDatabaseResponse,
   ImportDatabasePostParams,
   LogFileListResponse,
   LogResponse,
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
   exportDatabaseContentToFile,
   importDatabaseContentFromFile,
   importDatabaseContentFromQueryFile,
   removeAllDatabaseContent,
   sendQuery,
   sendQueryAsString,
} from "../../common-tools/database-tools/database-manager";
import { queryToGetAllGroups } from "../groups/queries";
import { queryToGetGroupsReceivingMoreUsers } from "../groups-finder/queries";
import {
   BACKUP_LOGS_TO_FILE_FREQUENCY,
   DEMO_ACCOUNTS,
   GROUP_SLOTS_CONFIGS,
   LOG_USAGE_REPORT_FREQUENCY,
} from "../../configurations";
import { GroupQuality } from "../groups-finder/tools/types";
import { getCredentialsHash, validateAdminCredentials } from "./tools/validateAdminCredentials";
import { makeQueryForVisualizer, nodesToJson } from "../../common-tools/database-tools/visualizer-proxy-tools";
import {
   createFolder,
   createZipFileFromDirectory,
   deleteFile,
   getFileContent,
   readFolder,
} from "../../common-tools/files-tools/files-tools";
import { deleteFilesFromS3, readFileContentFromS3, uploadFileToS3 } from "../../common-tools/aws/s3-tools";
import { fromQueryToUser, fromQueryToUserList } from "../user/tools/data-conversion";
import {
   getNotificationsDeliveryErrors,
   sendPushNotifications,
} from "../../common-tools/push-notifications/push-notifications";
import { time } from "../../common-tools/js-tools/js-tools";
import {
   executeSystemCommand,
   isProductionMode,
   isRunningOnAws,
} from "../../common-tools/process/process-tools";
import {
   exportDatabaseContentFromNeptune,
   importDatabaseContentCsvToNeptune,
   importDatabaseContentXmlToNeptune,
} from "../../common-tools/aws/neptune-tools";
import { sendEmailUsingSES } from "../../common-tools/aws/ses-tools";
import { tryToGetErrorMessage } from "../../common-tools/httpRequest/tools/tryToGetErrorMessage";
import { createFakeUser } from "../../tests/tools/users";
import { createEmailLoginToken } from "../email-login/models";
import { createGroup, getGroupById, getSlotIdFromUsersAmount } from "../groups/models";
import koaBody = require("koa-body");
import { Group } from "../../shared-tools/endpoints-interfaces/groups";
import { backupLogs, restoreLogs } from "../../common-tools/log-tool/storage/log-storage";
import { runCodeFromString } from "../../common-tools/runCodeFromString/runCodeFromString";
import { log } from "../../common-tools/log-tool/log";
import { LogId } from "../../common-tools/log-tool/types";
import {
   deleteInMemoryLogEntry,
   getAllInMemoryLogs,
} from "../../common-tools/log-tool/storage/log-storage-memory";
import { ENTRY_SEPARATOR_STRING, logsConfig } from "../../common-tools/log-tool/config";

/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
export async function initializeAdmin(): Promise<void> {
   createFolder("admin-uploads");
   await restoreLogs();
   setIntervalAsync(backupLogs, BACKUP_LOGS_TO_FILE_FREQUENCY);
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
   const amountOfWantedUsers = (
      await sendQuery(() => queryToGetAllUsers().has("unwantedUser", false).count().next())
   ).value;
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
      wantedUsers: amountOfWantedUsers,
      incompleteUsers,
      amountOfGroups,
      totalOpenGroups,
      openGroupsBySlot,
      timeSpentOnReportMs,
   };

   log(report, LogId.UsersAndGroupsAmount);
}

export async function logFileListGet(
   params: AdminProtectionParams,
   ctx: BaseContext,
): Promise<LogFileListResponse[]> {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return null;
   }

   const result = [];
   const logs = getAllInMemoryLogs();

   Object.keys(logs).forEach(logId => {
      const logConfig = logsConfig.find(config => config.id === logId);
      result.push({ logId, category: logConfig.category, description: logConfig.description });
   });

   return result;
}

export async function logGet(params: AdminLogGetParams, ctx: BaseContext): Promise<LogResponse> {
   const { logId } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return null;
   }

   const log = getAllInMemoryLogs()[logId];

   if (!log) {
      ctx.throw(400, "Log not found");
      return;
   }

   const logConfig = logsConfig.find(config => config.id === logId);

   return {
      id: logId,
      category: logConfig.category,
      description: logConfig.description,
      separator: ENTRY_SEPARATOR_STRING,
      log,
   };
}

export async function logDeleteEntryPost(
   params: AdminDeleteLogEntryParams,
   ctx: BaseContext,
): Promise<{ success: boolean }> {
   const { logId, entryId } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return null;
   }

   const log = getAllInMemoryLogs()[logId];

   if (!log) {
      ctx.throw(400, "Log not found");
      return;
   }

   deleteInMemoryLogEntry(logId, entryId);
   backupLogs([logId]);

   return { success: true };
}

export async function importDatabasePost(params: ImportDatabasePostParams, ctx: BaseContext) {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx.throw(passwordValidation.error);
      return;
   }

   let responses = "";

   if (params.format === DatabaseContentFileFormat.NeptuneCsv) {
      if (isRunningOnAws()) {
         responses += JSON.stringify(await importDatabaseContentCsvToNeptune(params, ctx));
         // deleteFilesFromS3(params.filePaths); // This seems to prevent loader to work, it uses the files in the S3 for some time and cannot be removed.
      } else {
         ctx.throw(
            400,
            "Error: Importing Neptune CSV files only works when running on AWS (in production mode) and when USING_AWS = true",
         );
      }
   }

   if (params.format === DatabaseContentFileFormat.GremlinQuery) {
      for (const filePath of params.filePaths) {
         let fileContent: string;
         if (isRunningOnAws()) {
            fileContent = await readFileContentFromS3(filePath);
            // deleteFilesFromS3(params.filePaths); // This seems to prevent loader to work, it uses the files in the S3 for some time and cannot be removed.
         } else {
            fileContent = getFileContent(filePath);
         }

         responses += await importDatabaseContentFromQueryFile({ fileContent, fileNameForLogs: filePath });
      }
   }

   if (params.format === DatabaseContentFileFormat.GraphMl) {
      if (params.filePaths.length > 1) {
         ctx.throw(
            400,
            "Error: GraphML file format is only 1 file for the whole database. Multiple files were selected.",
         );
      }

      const filePath = params.filePaths[0];
      if (isRunningOnAws()) {
         try {
            responses += await importDatabaseContentXmlToNeptune(filePath, ctx);
         } catch (e) {
            responses += tryToGetErrorMessage(e);
         }
         deleteFilesFromS3(params.filePaths);
      } else {
         await importDatabaseContentFromFile(filePath);
         responses += "Done";
      }
   }

   for (const filePath of params.filePaths) {
      deleteFile(filePath);
   }

   return responses;
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

   if (isRunningOnAws()) {
      try {
         return await exportDatabaseContentFromNeptune({
            targetFilePath: "admin-uploads/db.zip",
            cloneClusterBeforeBackup: false,
         });
      } catch (e) {
         ctx.throw(400, tryToGetErrorMessage(e));
      }
   } else {
      await exportDatabaseContentToFile("admin-uploads/temp/db-export/db-exported.xml");
      await createZipFileFromDirectory(
         "admin-uploads/temp/db-export",
         "admin-uploads/db-export/db-exported.zip",
      );
      // deleteFolder("admin-uploads/temp");
      return {
         commandResponse: "Done",
         folder: `api/admin-uploads/db-export/db-exported.zip?hash=${getCredentialsHash()}`,
      };
   }
}

export async function visualizerPost(params: VisualizerQueryParams, ctx: BaseContext) {
   const { query, nodeLimit } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   const result = await sendQueryAsString(makeQueryForVisualizer(query, nodeLimit));
   return nodesToJson(result._items);
}

export async function queryPost(
   params: AdminQueryParams,
   ctx: BaseContext,
): Promise<AdminQueryResponse | string> {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   const { query } = params;

   const result = await sendQueryAsString(query);
   return result;
}

export async function deleteDbPost(params: VisualizerQueryParams, ctx: BaseContext) {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   await removeAllDatabaseContent();
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
): Promise<{ filePaths: string[] }> {
   const filePaths: string[] = [];
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
            localFilePath: file.path,
            s3TargetPath: folderPath + fileName,
         });

         // Remove the file from the server because it's already on the S3
         await fs.promises.unlink(file.path);

         filePaths.push(fileNameInS3);
      } else {
         filePaths.push(folderPath + fileName);
      }
   }

   return { filePaths };
}

export async function adminNotificationSendPost(params: AdminNotificationPostParams, ctx: BaseContext) {
   const { channelId, onlyReturnUsersAmount, filters, notificationContent, sendEmailNotification, logResult } =
      params;

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
         logResult,
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

   if (logResult) {
      log(
         {
            to: users?.map(user => user.notificationsToken) ?? [],
            title: notificationContent.title,
            body: notificationContent.text,
            result: expoPushTickets,
         },
         LogId.TestNotificationsResult,
      );
   }

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

export async function notificationStatusGet(params: AdminNotificationStatusGet, ctx: BaseContext) {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      ctx?.throw(passwordValidation.error);
      return;
   }

   const errors = await getNotificationsDeliveryErrors([{ id: params.ticketId, status: "ok" }]);

   let returnMessage = `Errors amount: ${errors.length} \n`;
   if (errors.length > 0) {
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

// Runs javascript code and returns output
export async function runCodePost(
   params: AdminCodePostParams,
   ctx: BaseContext,
): Promise<{ response: any } | string> {
   const { code } = params;

   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   return { response: await runCodeFromString(code) };
}

/**
 * Endpoints to get a specific group. The normal group endpoint requires a token. Here the admin can see a group without token.
 */
export async function getGroup(params: AdminGroupGetParams, ctx: BaseContext): Promise<Group | string> {
   const passwordValidation = await validateAdminCredentials(params);
   if (!passwordValidation.isValid) {
      return passwordValidation.error;
   }

   const group: Group = await getGroupById(params.groupId, {
      includeFullDetails: true,
      ctx,
   });
   return group;
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
