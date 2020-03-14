import * as Router from '@koa/router';
import { profileStatusGet, setupFileReceiver, userGet, userPropsPost } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(router: Router): void {
   questionsRoutes(router);

   router.get('/user/profile-status', async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx)));
   router.get('/user', async ctx => (ctx.body = await userGet(ctx.request.body, ctx)));
   router.post('/user/props', async ctx => (ctx.body = await userPropsPost(ctx.request.body, ctx)));
   router.post('/user/upload_picture', setupFileReceiver().single('image'), ctx => (ctx.body = ctx.file?.filename));
}
