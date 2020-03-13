import * as multer from '@koa/multer';
import * as Router from '@koa/router';
import { profileStatusGet, userGet, userPropsPost } from './models';
import { questionsRoutes } from './questions/routes';

const upload = multer();

export function userRoutes(router: Router): void {
   questionsRoutes(router);

   router.get('/user/profile-status', async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx)));
   router.get('/user', async ctx => (ctx.body = await userGet(ctx.request.body, ctx)));
   router.post('/user/props', async ctx => (ctx.body = await userPropsPost(ctx.request.body, ctx)));

   router.post('/user/upload_picture', upload.single('avatar'), ctx => {
      console.log('ctx.request.file', ctx.request.file);
      console.log('ctx.file', ctx.file);
      console.log('ctx.request.body', ctx.request.body);
      ctx.body = 'done';
   }); // TODO: Testear esto
}
