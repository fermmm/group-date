import * as Router from '@koa/router';
import { onFileReceived, onFileSaved, profileStatusGet, userGet, userPropsPost } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(router: Router): void {
   questionsRoutes(router);

   router.get('/user/profile-status', async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx)));
   router.get('/user', async ctx => (ctx.body = await userGet(ctx.request.body, ctx)));
   router.post('/user/props', async ctx => (ctx.body = await userPropsPost(ctx.request.body, ctx)));
   router.post(
      '/user/upload_picture',
      onFileReceived,
      async ctx => (ctx.body = await onFileSaved(ctx.request.files.image, ctx)),
   );
}
