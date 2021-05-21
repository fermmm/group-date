import * as ratelimit from "koa-ratelimit";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { RATE_LIMITER_CACHE_CLEAR_INTERVAL } from "../../configurations";
import { Group } from "../../shared-tools/endpoints-interfaces/groups";
import { User } from "../../shared-tools/endpoints-interfaces/user";

const db = new Map();

export async function initializeSecurityTools() {
   setIntervalAsync(clearRateLimiterCache, RATE_LIMITER_CACHE_CLEAR_INTERVAL);
}

export const rateLimiterConfig: ratelimit.MiddlewareOptions = {
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
export function removePrivacySensitiveUserProps<T extends User | Partial<User>>(user: T): T {
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
   delete user.targetGenderIsSelected;
   return user;
}

/**
 * Removes group props and member user props that should never get out of the server
 */
export function removePrivacySensitiveGroupProps(group: Group): Group {
   delete group.feedback;
   return group;
}

export function clearRateLimiterCache() {
   db.clear();
}
