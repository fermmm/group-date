import { fileOrFolderExists } from "./../files-tools/files-tools";
import * as schedule from "node-schedule";
import { loadDatabaseFromDisk, saveDatabaseToFile } from "../database-tools/database-manager";
import {
   DATABASE_BACKUP_DAILY,
   DATABASE_BACKUP_HOUR,
   DATABASE_BACKUP_MONTHLY,
   DATABASE_BACKUP_WEEKLY,
   RESTORE_DATABASE_ON_INIT,
} from "../../configurations";
import { copyFile, createFolder } from "../files-tools/files-tools";
import { executeFunctionBeforeExiting } from "../process/process-tools";
import { databaseIsEmpty } from "../database-tools/common-queries";

export async function initializeDatabaseBackups() {
   if (process.env.PERFORM_DATABASE_BACKUPS === "true" && process.env.NO_DATABASE !== "true") {
      const databaseEmpty = await databaseIsEmpty();

      // Load database contents from latest backup if any
      if (RESTORE_DATABASE_ON_INIT && databaseEmpty && fileOrFolderExists("database-backups/latest.xml")) {
         await loadDatabaseFromDisk("../../database-backups/latest.xml");
      }
      await initializeBackupDatabaseSchedule();
      backupDatabaseWhenExiting();
   }
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
      schedule.scheduleJob({ ...hour, date: 0, month: 0 }, () => backupDatabaseToFile("monthly", "january"));
      schedule.scheduleJob({ ...hour, date: 0, month: 1 }, () => backupDatabaseToFile("monthly", "february"));
      schedule.scheduleJob({ ...hour, date: 0, month: 2 }, () => backupDatabaseToFile("monthly", "march"));
      schedule.scheduleJob({ ...hour, date: 0, month: 3 }, () => backupDatabaseToFile("monthly", "april"));
      schedule.scheduleJob({ ...hour, date: 0, month: 4 }, () => backupDatabaseToFile("monthly", "may"));
      schedule.scheduleJob({ ...hour, date: 0, month: 5 }, () => backupDatabaseToFile("monthly", "june"));
      schedule.scheduleJob({ ...hour, date: 0, month: 6 }, () => backupDatabaseToFile("monthly", "july"));
      schedule.scheduleJob({ ...hour, date: 0, month: 7 }, () => backupDatabaseToFile("monthly", "august"));
      schedule.scheduleJob({ ...hour, date: 0, month: 8 }, () => backupDatabaseToFile("monthly", "september"));
      schedule.scheduleJob({ ...hour, date: 0, month: 9 }, () => backupDatabaseToFile("monthly", "october"));
      schedule.scheduleJob({ ...hour, date: 0, month: 10 }, () => backupDatabaseToFile("monthly", "november"));
      schedule.scheduleJob({ ...hour, date: 0, month: 11 }, () => backupDatabaseToFile("monthly", "december"));
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