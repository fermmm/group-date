import * as Koa from 'koa';
import * as r from 'koa-route';
import { profileStatusGet } from './models';

export function userRoutes(app: Koa): void {
   app.use(
      r.get(
         '/user/profile-status',
         async ctx => (ctx.body = await profileStatusGet(ctx.request.query)),
      ),
   );
}
