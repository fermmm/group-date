import * as ratelimit from 'koa-ratelimit';
import { User } from '../../shared-tools/endpoints-interfaces/user';

const db = new Map();

export const rateLimitterConfig: ratelimit.MiddlewareOptions = {
   driver: 'memory',
   db,
   duration: 2 * 1000,
   max: 10,
   errorMessage: 'Too many interactions in a short period of time',
   id: ctx => ctx.ip,
   headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total',
   },
   disableHeader: false,
};

/**
 * Removes user props that should never get out of the server like the user position
 */
export function removePrivacySensitiveUserProps<T extends User | Partial<User>>(user: T): T {
   const result: T = { ...user };
   delete result.token;
   delete result.email;
   delete result.locationLat;
   delete result.locationLon;
   return result;
}
