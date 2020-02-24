import * as Koa from 'koa';
import * as r from 'koa-route';
import { profileStatusGet } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(app: Koa): void {
   questionsRoutes(app);
   
   app.use(
      r.get(
         '/user/profile-status',
         async ctx => (ctx.body = await profileStatusGet(ctx.request.query, ctx)),
      ),
   );
}
