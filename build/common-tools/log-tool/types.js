"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogCategory = exports.LogId = void 0;
/**
 * The string part is used as the file name so make sure it does not contain spaces or symbols.
 */
var LogId;
(function (LogId) {
    LogId["GroupFinderTasks"] = "group_finder_tasks";
    LogId["GroupsTasks"] = "groups_tasks";
    LogId["NotifyUsersAboutNewCards"] = "notify_users_about_new_cards";
    LogId["GroupFinderProblems"] = "group_finder_problems";
    LogId["AmountOfUsers"] = "amount_of_users";
    LogId["ServerStatus"] = "server_status";
    LogId["Backups"] = "backups";
    LogId["UsersReported"] = "users_reported";
    LogId["TestNotificationsResult"] = "test_notifications_result";
})(LogId = exports.LogId || (exports.LogId = {}));
var LogCategory;
(function (LogCategory) {
    LogCategory["Users"] = "Users";
    LogCategory["Problems"] = "Problems";
    LogCategory["Maintenance"] = "Maintenance";
    LogCategory["Debug"] = "Debug";
    LogCategory["Default"] = "Default";
})(LogCategory = exports.LogCategory || (exports.LogCategory = {}));
//# sourceMappingURL=types.js.map