import * as Koa from 'koa';
import * as r from 'koa-route';
import { profileStatusGet, userGet } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(app: Koa): void {
   questionsRoutes(app);
   
   app.use(
      r.get(
         '/user/profile-status',
         async ctx => (ctx.body = await profileStatusGet(ctx.request.query, ctx)),
      ),
   );

   app.use(
      r.get(
         '/user',
         async ctx => (ctx.body = await userGet(ctx.request.query, ctx)),
      ),
   );
}
