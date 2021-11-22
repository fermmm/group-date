"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRateLimiterCache = exports.removePrivacySensitiveGroupProps = exports.removePrivacySensitiveUserProps = exports.rateLimiterConfig = exports.initializeSecurityTools = void 0;
const dynamic_1 = require("set-interval-async/dynamic");
const configurations_1 = require("../../configurations");
const db = new Map();
async function initializeSecurityTools() {
    (0, dynamic_1.setIntervalAsync)(clearRateLimiterCache, configurations_1.RATE_LIMITER_CACHE_CLEAR_INTERVAL);
}
exports.initializeSecurityTools = initializeSecurityTools;
exports.rateLimiterConfig = {
    driver: "memory",
    db,
    duration: 2 * 1000,
    max: 30,
    errorMessage: "Too many interactions in a short period of time",
    id: ctx => ctx.request.ip,
    headers: {
        remaining: "Rate-Limit-Remaining",
        reset: "Rate-Limit-Reset",
        total: "Rate-Limit-Total",
    },
    disableHeader: false,
};
/**
 * Removes user props that should never get out of the server like the user position
 */
function removePrivacySensitiveUserProps(user) {
    delete user.token;
    delete user.notificationsToken;
    delete user.email;
    delete user.locationLat;
    delete user.locationLon;
    delete user.isAdmin;
    delete user.notifications;
    delete user.sendNewUsersNotification;
    delete user.lastGroupJoinedDate;
    delete user.lastLoginDate;
    delete user.questionsShowed;
    delete user.registrationDate;
    delete user.banReasonsAmount;
    delete user.banReasons;
    return user;
}
exports.removePrivacySensitiveUserProps = removePrivacySensitiveUserProps;
/**
 * Removes group props and member user props that should never get out of the server
 */
function removePrivacySensitiveGroupProps(group) {
    delete group.feedback;
    return group;
}
exports.removePrivacySensitiveGroupProps = removePrivacySensitiveGroupProps;
function clearRateLimiterCache() {
    db.clear();
}
exports.clearRateLimiterCache = clearRateLimiterCache;
//# sourceMappingURL=security-tools.js.map