import * as ratelimit from 'koa-ratelimit';

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
