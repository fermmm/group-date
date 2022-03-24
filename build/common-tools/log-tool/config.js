"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGS_DIR_NAME = exports.ENTRY_SEPARATOR_STRING = exports.logsConfig = void 0;
const constants_1 = require("../math-tools/constants");
const types_1 = require("./types");
exports.logsConfig = [
    {
        id: types_1.LogId.GroupFinderTasks,
        category: types_1.LogCategory.Maintenance,
        description: "Useful to know if the group finder is executing and how much time it takes",
        maxEntries: 40,
    },
    {
        id: types_1.LogId.GroupsTasks,
        category: types_1.LogCategory.Maintenance,
        description: "Logs about group tasks like finding slots to release, useful to check if it's executing and how much time it takes",
        maxEntries: 40,
    },
    {
        id: types_1.LogId.NotifyUsersAboutNewCards,
        category: types_1.LogCategory.Maintenance,
        description: "This log is useful to know how much time it takes to notify a user about new cards",
        maxEntries: 400,
    },
    {
        id: types_1.LogId.GroupFinderProblems,
        category: types_1.LogCategory.Problems,
        description: "Logs about problems with the group finder, this log should be empty",
        maxEntries: 400,
        backupAfterEntryAdded: true,
    },
    {
        id: types_1.LogId.AmountOfUsers,
        category: types_1.LogCategory.Users,
        description: "Logs how many users are registered on the app",
        maxEntryAge: constants_1.YEAR_IN_SECONDS,
    },
    {
        id: types_1.LogId.ServerStatus,
        category: types_1.LogCategory.Maintenance,
        description: "Logs the server status like when the serer starts",
        maxEntries: 40,
        backupAfterEntryAdded: true,
    },
    {
        id: types_1.LogId.Backups,
        category: types_1.LogCategory.Maintenance,
        description: "Logs when a database backup is done and how much time it took",
        maxEntries: 20,
        backupAfterEntryAdded: true,
    },
    {
        id: types_1.LogId.UsersReported,
        category: types_1.LogCategory.Users,
        description: "This log contains the users reported in the app",
    },
    {
        id: types_1.LogId.TestNotificationsResult,
        category: types_1.LogCategory.Debug,
        description: "This log contains a report of what happened with a notification sent by the admin panel, useful for debugging",
        maxEntries: 40,
    },
];
exports.ENTRY_SEPARATOR_STRING = "____end\n";
exports.LOGS_DIR_NAME = "logs2";
//# sourceMappingURL=config.js.map