import * as Router from '@koa/router';
import { onFileReceived, onFileSaved, profileStatusGet, userGet, userPost } from './models';
import { questionsRoutes } from './questions/routes';

export function userRoutes(router: Router): void {
   questionsRoutes(router);

   router.get('/user/profile-status', async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx)));
   router.get('/user', async ctx => (ctx.body = await userGet(ctx.request.body, ctx)));
   router.post('/user', async ctx => (ctx.body = await userPost(ctx.request.body, ctx)));
   router.post(
      '/user/upload-picture',
      onFileReceived,
      async ctx => (ctx.body = await onFileSaved(ctx.request.files.image, ctx)),
   );
}
