"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupIsEnabled = exports.initializeDatabaseBackups = exports.DB_EXPORT_LATEST_FILE = exports.DB_EXPORT_FOLDER = void 0;
const schedule = require("node-schedule");
const database_manager_1 = require("../database-tools/database-manager");
const configurations_1 = require("../../configurations");
const files_tools_1 = require("../files-tools/files-tools");
const process_tools_1 = require("../process/process-tools");
const common_queries_1 = require("../database-tools/common-queries");
exports.DB_EXPORT_FOLDER = "database-backups";
exports.DB_EXPORT_LATEST_FILE = "latest";
async function initializeDatabaseBackups() {
    if (backupIsEnabled()) {
        const databaseEmpty = await (0, common_queries_1.databaseIsEmpty)();
        // Load database contents from latest backup if any
        if (process.env.RESTORE_DATABASE_ON_INIT !== "false" && databaseEmpty) {
            await restoreDatabase(exports.DB_EXPORT_FOLDER, exports.DB_EXPORT_LATEST_FILE);
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
    (0, files_tools_1.createFolder)("database-backups");
    if (configurations_1.DATABASE_BACKUP_DAILY) {
        schedule.scheduleJob({ ...hour, dayOfWeek: 0 }, () => backupDatabase("daily", "monday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 1 }, () => backupDatabase("daily", "tuesday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 2 }, () => backupDatabase("daily", "wednesday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 3 }, () => backupDatabase("daily", "thursday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 4 }, () => backupDatabase("daily", "friday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 5 }, () => backupDatabase("daily", "saturday"));
        schedule.scheduleJob({ ...hour, dayOfWeek: 6 }, () => backupDatabase("daily", "sunday"));
    }
    if (configurations_1.DATABASE_BACKUP_WEEKLY) {
        schedule.scheduleJob({ ...hour, date: 7 }, () => backupDatabase("weekly", "week1"));
        schedule.scheduleJob({ ...hour, date: 14 }, () => backupDatabase("weekly", "week2"));
        schedule.scheduleJob({ ...hour, date: 21 }, () => backupDatabase("weekly", "week3"));
        schedule.scheduleJob({ ...hour, date: 28 }, () => backupDatabase("weekly", "week4"));
    }
    if (configurations_1.DATABASE_BACKUP_MONTHLY) {
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
async function backupDatabase(folderPath, fileName, settings) {
    const { saveLog = true } = settings !== null && settings !== void 0 ? settings : {};
    let profiler;
    if (saveLog) {
        profiler = logTimeToFile("backups");
    }
    await (0, database_manager_1.exportDatabaseContentToFile)(`${folderPath}/${fileName}.xml`);
    (0, files_tools_1.copyFile)(`${folderPath}/${fileName}.xml`, `${exports.DB_EXPORT_FOLDER}/${exports.DB_EXPORT_LATEST_FILE}.xml`);
    if (saveLog) {
        profiler.done({ message: `Database backup done in ${`${folderPath}/${fileName}.xml`}` });
    }
}
// TODO: Add support for AWS database
async function restoreDatabase(folderPath, fileName) {
    if (!(0, files_tools_1.fileOrFolderExists)(`${folderPath}/${fileName}.xml`)) {
        return;
    }
    await (0, database_manager_1.importDatabaseContentFromFile)(`${folderPath}/${fileName}.xml`);
}
function backupDatabaseWhenExiting() {
    (0, process_tools_1.executeFunctionBeforeExiting)(async () => {
        await backupDatabase(exports.DB_EXPORT_FOLDER, exports.DB_EXPORT_LATEST_FILE, { saveLog: false });
    });
}
//# sourceMappingURL=backups.js.map