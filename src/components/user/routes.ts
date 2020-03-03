import * as Koa from 'koa';
import * as r from 'koa-route';
import { profileStatusGet, userGet, userPropsPost } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(app: Koa): void {
   questionsRoutes(app);

   app.use(r.get('/user/profile-status', async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx))));

   app.use(r.get('/user', async ctx => (ctx.body = await userGet(ctx.request.body, ctx))));

   app.use(r.post('/user/props', async ctx => (ctx.body = await userPropsPost(ctx.request.body, ctx))));
}
