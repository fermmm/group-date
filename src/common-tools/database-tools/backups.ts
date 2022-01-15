import * as schedule from "node-schedule";
import * as winston from "winston";
import { importDatabaseContentFromFile, exportDatabaseContentToFile } from "../database-tools/database-manager";
import {
   DATABASE_BACKUP_DAILY,
   DATABASE_BACKUP_HOUR,
   DATABASE_BACKUP_MONTHLY,
   DATABASE_BACKUP_WEEKLY,
} from "../../configurations";
import { copyFile, fileOrFolderExists, createFolder } from "../files-tools/files-tools";
import { executeFunctionBeforeExiting } from "../process/process-tools";
import { databaseIsEmpty } from "../database-tools/common-queries";

export const DB_EXPORT_FOLDER = "database-backups";
export const DB_EXPORT_LATEST_FILE = "latest";

export async function initializeDatabaseBackups() {
   if (backupIsEnabled()) {
      const databaseEmpty = await databaseIsEmpty();

      // Load database contents from latest backup if any
      if (process.env.RESTORE_DATABASE_ON_INIT !== "false" && databaseEmpty) {
         await restoreDatabase(DB_EXPORT_FOLDER, DB_EXPORT_LATEST_FILE);
      }
      await initializeBackupDatabaseSchedule();
      backupDatabaseWhenExiting();
   }
}

export function backupIsEnabled(): boolean {
   return process.env.PERFORM_DATABASE_BACKUPS === "true" && process.env.NO_DATABASE !== "true";
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
      schedule.scheduleJob({ ...hour, dayOfWeek: 0 }, () => backupDatabase("daily", "monday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 1 }, () => backupDatabase("daily", "tuesday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 2 }, () => backupDatabase("daily", "wednesday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 3 }, () => backupDatabase("daily", "thursday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 4 }, () => backupDatabase("daily", "friday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 5 }, () => backupDatabase("daily", "saturday"));
      schedule.scheduleJob({ ...hour, dayOfWeek: 6 }, () => backupDatabase("daily", "sunday"));
   }

   if (DATABASE_BACKUP_WEEKLY) {
      schedule.scheduleJob({ ...hour, date: 7 }, () => backupDatabase("weekly", "week1"));
      schedule.scheduleJob({ ...hour, date: 14 }, () => backupDatabase("weekly", "week2"));
      schedule.scheduleJob({ ...hour, date: 21 }, () => backupDatabase("weekly", "week3"));
      schedule.scheduleJob({ ...hour, date: 28 }, () => backupDatabase("weekly", "week4"));
   }

   if (DATABASE_BACKUP_MONTHLY) {
      schedule.scheduleJob({ ...hour, date: 0, month: 0 }, () => backupDatabase("monthly", "january"));
      schedule.scheduleJob({ ...hour, date: 0, month: 1 }, () => backupDatabase("monthly", "february"));
      schedule.scheduleJob({ ...hour, date: 0, month: 2 }, () => backupDatabase("monthly", "march"));
      schedule.scheduleJob({ ...hour, date: 0, month: 3 }, () => backupDatabase("monthly", "april"));
      schedule.scheduleJob({ ...hour, date: 0, month: 4 }, () => backupDatabase("monthly", "may"));
      schedule.scheduleJob({ ...hour, date: 0, month: 5 }, () => backupDatabase("monthly", "june"));
      schedule.scheduleJob({ ...hour, date: 0, month: 6 }, () => backupDatabase("monthly", "july"));
      schedule.scheduleJob({ ...hour, date: 0, month: 7 }, () => backupDatabase("monthly", "august"));
      schedule.scheduleJob({ ...hour, date: 0, month: 8 }, () => backupDatabase("monthly", "september"));
      schedule.scheduleJob({ ...hour, date: 0, month: 9 }, () => backupDatabase("monthly", "october"));
      schedule.scheduleJob({ ...hour, date: 0, month: 10 }, () => backupDatabase("monthly", "november"));
      schedule.scheduleJob({ ...hour, date: 0, month: 11 }, () => backupDatabase("monthly", "december"));
   }
}

// TODO: Add support for AWS database
async function backupDatabase(folderPath: string, fileName: string, settings?: { saveLog?: boolean }) {
   const { saveLog = true } = settings ?? {};

   let profiler: winston.Profiler | { done: (info?: any) => boolean };

   if (saveLog) {
      profiler = logTimeToFile("backups");
   }

   await exportDatabaseContentToFile(`${folderPath}/${fileName}.xml`);
   copyFile(`${folderPath}/${fileName}.xml`, `${DB_EXPORT_FOLDER}/${DB_EXPORT_LATEST_FILE}.xml`);

   if (saveLog) {
      profiler.done({ message: `Database backup done in ${`${folderPath}/${fileName}.xml`}` });
   }
}

// TODO: Add support for AWS database
async function restoreDatabase(folderPath: string, fileName: string) {
   if (!fileOrFolderExists(`${folderPath}/${fileName}.xml`)) {
      return;
   }

   await importDatabaseContentFromFile(`${folderPath}/${fileName}.xml`);
}

function backupDatabaseWhenExiting() {
   executeFunctionBeforeExiting(async () => {
      await backupDatabase(DB_EXPORT_FOLDER, DB_EXPORT_LATEST_FILE, { saveLog: false });
   });
}
