import { YEAR_IN_SECONDS } from "../math-tools/constants";
import { LogCategory, LogId, LogsConfig } from "./types";

export const logsConfig: LogsConfig[] = [
   {
      id: LogId.UsersAndGroupsAmount,
      category: LogCategory.Users,
      description: "Logs how many users are registered on the app and how many groups were created",
      maxEntryAge: YEAR_IN_SECONDS,
      backupAfterEntryAdded: true,
   },
   {
      id: LogId.UsersReported,
      category: LogCategory.Users,
      description: "This log contains the users reported in the app",
      backupAfterEntryAdded: true,
   },
   {
      id: LogId.GroupFinderTasks,
      category: LogCategory.Maintenance,
      description: "Useful to know if the group finder is executing and how much time it takes",
      maxEntries: 40,
   },
   {
      id: LogId.GroupFinderProblems,
      category: LogCategory.Problems,
      description: "Logs about problems with the group finder, this log should be empty",
      maxEntries: 400,
      backupAfterEntryAdded: true,
   },
   {
      id: LogId.GroupsTasks,
      category: LogCategory.Maintenance,
      description:
         "Logs about group tasks like finding slots to release, useful to check if it's executing and how much time it takes",
      maxEntries: 40,
   },
   {
      id: LogId.NotifyUsersAboutNewCards,
      category: LogCategory.Maintenance,
      description: "This log is useful to know how much time it takes to notify a user about new cards",
      maxEntries: 400,
   },
   {
      id: LogId.ServerStatus,
      category: LogCategory.Maintenance,
      description: "Logs the server status like when the serer starts",
      maxEntries: 40,
      backupAfterEntryAdded: true,
   },
   {
      id: LogId.Backups,
      category: LogCategory.Maintenance,
      description: "Logs when a database backup is done and how much time it took",
      maxEntries: 20,
      backupAfterEntryAdded: true,
   },
   {
      id: LogId.TestNotificationsResult,
      category: LogCategory.Debug,
      description:
         "This log contains a report of what happened with a notification sent by the admin panel, useful for debugging",
      maxEntries: 40,
   },
   {
      id: LogId.DebugGeneral,
      category: LogCategory.Debug,
      description: "This log can contain any debug information",
      maxEntries: 100,
   },
];

export const ENTRY_SEPARATOR_STRING = "____end\n";
export const LOGS_DIR_NAME = "logs";
