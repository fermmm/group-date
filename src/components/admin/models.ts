import { fileOrFolderExists } from "./../../common-tools/files-tools/files-tools";
import { BaseContext } from "koa";
import * as moment from "moment";
import * as fs from "fs";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { performance } from "perf_hooks";
import * as schedule from "node-schedule";
import {
   AdminChatGetAllParams,
   AdminChatGetParams,
   AdminChatPostParams,
   AdminConvertPostParams,
   AdminLogGetParams,
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
import {
   loadDatabaseFromDisk,
   saveDatabaseToFile,
   sendQuery,
} from "../../common-tools/database-tools/database-manager";
import { queryToGetAllGroups } from "../groups/queries";
import { queryToGetGroupsReceivingMoreUsers } from "../groups-finder/queries";
import {
   DATABASE_BACKUP_DAILY,
   DATABASE_BACKUP_HOUR,
   DATABASE_BACKUP_MONTHLY,
   DATABASE_BACKUP_WEEKLY,
   GROUP_SLOTS_CONFIGS,
   LOG_USAGE_REPORT_FREQUENCY,
   RESTORE_DATABASE_ON_INIT,
} from "../../configurations";
import { GroupQuality } from "../groups-finder/tools/types";
import { copyFile, createFolder } from "../../common-tools/files-tools/files-tools";
import { executeFunctionBeforeExiting } from "../../common-tools/process/process-tools";
import { databaseIsEmpty } from "../../common-tools/database-tools/common-queries";

/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
export async function initializeAdmin(): Promise<void> {
   await updateAmountOfUsersCount();
   setIntervalAsync(logUsageReport, LOG_USAGE_REPORT_FREQUENCY);

   if (process.env.PERFORM_DATABASE_BACKUPS) {
      const databaseEmpty = await databaseIsEmpty();
      // Load database contents from latest backup if any
      if (RESTORE_DATABASE_ON_INIT && databaseEmpty && fileOrFolderExists("database-backups/latest.xml")) {
         await loadDatabaseFromDisk("../../database-backups/latest.xml");
      }
      await initializeBackupDatabaseSchedule();
      backupDatabaseWhenExiting();
   }

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
 * Creates a database backup file on specific moments of the week, month, and year, creating a file
 * for each backup date, replacing previous files to not spam with unnecessary files.
 */
async function initializeBackupDatabaseSchedule() {
   const hour = { hour: DATABASE_BACKUP_HOUR };

   // In case there is no backup at all (first time server starts)
   createFolder("database-backups");

   if (DATABASE_BACKUP_DAILY) {
      schedule.scheduleJob({ ...hour, dayOfWeek: 0 }, () => backupDatabaseToFile("daily", "monday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 1 }, () => backupDatabaseToFile("daily", "tuesday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 2 }, () => backupDatabaseToFile("daily", "wednesday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 3 }, () => backupDatabaseToFile("daily", "thursday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 4 }, () => backupDatabaseToFile("daily", "friday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 5 }, () => backupDatabaseToFile("daily", "saturday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 6 }, () => backupDatabaseToFile("daily", "sunday"));
   }

   if (DATABASE_BACKUP_WEEKLY) {
      schedule.scheduleJob({ ...hour, date: 7 }, () => backupDatabaseToFile("weekly", "week1"));
      schedule.scheduleJob({ ...hour, date: 14 }, () => backupDatabaseToFile("weekly", "week2"));
      schedule.scheduleJob({ ...hour, date: 21 }, () => backupDatabaseToFile("weekly", "week3"));
      schedule.scheduleJob({ ...hour, date: 28 }, () => backupDatabaseToFile("weekly", "week4"));
   }

   if (DATABASE_BACKUP_MONTHLY) {
      schedule.scheduleJob({ ...hour, month: 0 }, () => backupDatabaseToFile("monthly", "january"));
      schedule.scheduleJob({ ...hour, month: 1 }, () => backupDatabaseToFile("monthly", "february"));
      schedule.scheduleJob({ ...hour, month: 2 }, () => backupDatabaseToFile("monthly", "march"));
      schedule.scheduleJob({ ...hour, month: 3 }, () => backupDatabaseToFile("monthly", "april"));
      schedule.scheduleJob({ ...hour, month: 4 }, () => backupDatabaseToFile("monthly", "may"));
      schedule.scheduleJob({ ...hour, month: 5 }, () => backupDatabaseToFile("monthly", "june"));
      schedule.scheduleJob({ ...hour, month: 6 }, () => backupDatabaseToFile("monthly", "july"));
      schedule.scheduleJob({ ...hour, month: 7 }, () => backupDatabaseToFile("monthly", "august"));
      schedule.scheduleJob({ ...hour, month: 8 }, () => backupDatabaseToFile("monthly", "september"));
      schedule.scheduleJob({ ...hour, month: 9 }, () => backupDatabaseToFile("monthly", "october"));
      schedule.scheduleJob({ ...hour, month: 10 }, () => backupDatabaseToFile("monthly", "november"));
      schedule.scheduleJob({ ...hour, month: 11 }, () => backupDatabaseToFile("monthly", "december"));
   }
}

async function backupDatabaseToFile(folderName: string, fileName: string) {
   const profiler = logTimeToFile("backups");
   // The ../../ are here because the path is relative to the database program folder (vendor/gremlin-local-server)
   await saveDatabaseToFile("../../database-backups/latest.xml");
   copyFile("database-backups/latest.xml", `database-backups/${folderName}/${fileName}.xml`);
   profiler.done({ message: `Database backup done in ${folderName}/${fileName}.xml` });
}

function backupDatabaseWhenExiting() {
   executeFunctionBeforeExiting(async () => {
      await saveDatabaseToFile("../../database-backups/latest.xml");
   });
}
