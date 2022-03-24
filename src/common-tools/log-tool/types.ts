export interface LogsConfig {
   /**
    * This will be used as the file name also so make sure it's a valid string for a file name, avoid spaces and symbols.
    */
   id: LogId;
   maxEntries?: number;
   /**
    * Default: undefined. Format: amount of seconds. When an entry is older than the given time, can be removed when a new one is added.
    */
   maxEntryAge?: number;
   description?: string;
   category?: LogCategory;
   /**
    * Default: undefined. When this is true: After adding a log entry in this log the file is saved to disk and/or storage server, this is useful to not lose the last log entry when there is a code failure.
    */
   backupAfterEntryAdded?: boolean;
}

/**
 * The string part is used as the file name so make sure it does not contain spaces or symbols.
 */
export enum LogId {
   GroupFinderTasks = "group_finder_tasks",
   GroupsTasks = "groups_tasks",
   NotifyUsersAboutNewCards = "notify_users_about_new_cards",
   GroupFinderProblems = "group_finder_problems",
   AmountOfUsers = "amount_of_users",
   ServerStatus = "server_status",
   Backups = "backups",
   UsersReported = "users_reported",
   TestNotificationsResult = "test_notifications_result",
}

export enum LogCategory {
   Users = "Users",
   Problems = "Problems",
   Maintenance = "Maintenance",
   Debug = "Debug",
   Default = "Default",
}
