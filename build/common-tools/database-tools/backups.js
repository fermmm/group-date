"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupIsEnabled = exports.initializeDatabaseBackups = exports.CURRENT_DB_EXPORT_PATH = void 0;
const files_tools_1 = require("./../files-tools/files-tools");
const schedule = require("node-schedule");
const database_manager_1 = require("../database-tools/database-manager");
const configurations_1 = require("../../configurations");
const files_tools_2 = require("../files-tools/files-tools");
const process_tools_1 = require("../process/process-tools");
const common_queries_1 = require("../database-tools/common-queries");
exports.CURRENT_DB_EXPORT_PATH = "database-backups/latest.xml";
async function initializeDatabaseBackups() {
    if (backupIsEnabled()) {
        const databaseEmpty = await (0, common_queries_1.databaseIsEmpty)();
        // Load database contents from latest backup if any
        if (process.env.RESTORE_DATABASE_ON_INIT !== "false" &&
            databaseEmpty &&
            (0, files_tools_1.fileOrFolderExists)(exports.CURRENT_DB_EXPORT_PATH)) {
            await (0, database_manager_1.importDatabaseContentFromFile)(exports.CURRENT_DB_EXPORT_PATH);
        }
        await initializeBackupDatabaseSchedule();
        backupDatabaseWhenExiting();
    }
}
exports.initializeDatabaseBackups = initializeDatabaseBackups;
function backupIsEnabled() {
    return process.env.PERFORM_DATABASE_BACKUPS === "true" && process.env.NO_DATABASE !== "true";
}
exports.backupIsEnabled = backupIsEnabled;
/**
 * Creates a database backup file on specific moments of the week, month, and year, creating a file
 * for each backup date, replacing previous files to not spam with unnecessary files.
 */
async function initializeBackupDatabaseSchedule() {
    const hour = { hour: configurations_1.DATABASE_BACKUP_HOUR };
    // In case there is no backup at all (first time server starts)
    (0, files_tools_2.createFolder)("database-backups");
    if (configurations_1.DATABASE_BACKUP_DAILY) {
        schedule.scheduleJob({ ...hour, dayOfWeek: 0 }, () => backupDatabaseToFile("daily", "monday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 1 }, () => backupDatabaseToFile("daily", "tuesday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 2 }, () => backupDatabaseToFile("daily", "wednesday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 3 }, () => backupDatabaseToFile("daily", "thursday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 4 }, () => backupDatabaseToFile("daily", "friday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 5 }, () => backupDatabaseToFile("daily", "saturday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 6 }, () => backupDatabaseToFile("daily", "sunday"));
    }
    if (configurations_1.DATABASE_BACKUP_WEEKLY) {
        schedule.scheduleJob({ ...hour, date: 7 }, () => backupDatabaseToFile("weekly", "week1"));
        schedule.scheduleJob({ ...hour, date: 14 }, () => backupDatabaseToFile("weekly", "week2"));
        schedule.scheduleJob({ ...hour, date: 21 }, () => backupDatabaseToFile("weekly", "week3"));
        schedule.scheduleJob({ ...hour, date: 28 }, () => backupDatabaseToFile("weekly", "week4"));
    }
    if (configurations_1.DATABASE_BACKUP_MONTHLY) {
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
async function backupDatabaseToFile(folderName, fileName, settings) {
    const { sendLog = true } = settings !== null && settings !== void 0 ? settings : {};
    const profiler = logTimeToFile("backups");
    // The ../../ are here because the path is relative to the database program folder (vendor/gremlin-local-server)
    await (0, database_manager_1.exportDatabaseContentToFile)(exports.CURRENT_DB_EXPORT_PATH);
    (0, files_tools_2.copyFile)(exports.CURRENT_DB_EXPORT_PATH, `database-backups/${folderName}/${fileName}.xml`);
    if (sendLog) {
        profiler.done({ message: `Database backup done in ${folderName}/${fileName}.xml` });
    }
}
function backupDatabaseWhenExiting() {
    (0, process_tools_1.executeFunctionBeforeExiting)(async () => {
        await (0, database_manager_1.exportDatabaseContentToFile)(exports.CURRENT_DB_EXPORT_PATH);
    });
}
//# sourceMappingURL=backups.js.map