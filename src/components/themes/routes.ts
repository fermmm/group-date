import * as Router from '@koa/router';
import {
   blockThemePost,
   createThemePost,
   removeThemesPost,
   subscribeToThemePost,
   themesGet,
   themesCreatedByUserGet,
   removeSubscriptionToThemePost,
   removeBlockToThemePost,
   appAuthoredThemesAsQuestionsGet,
} from './models';

export function themesRoutes(router: Router): void {
   router.get('/themes', async ctx => (ctx.body = await themesGet(ctx.request.body, ctx)));
   router.get('/themes/created', async ctx => (ctx.body = await themesCreatedByUserGet(ctx.request.body)));
   router.get('/themes/questions', async ctx => (ctx.body = appAuthoredThemesAsQuestionsGet(ctx)));
   router.post('/themes/create', async ctx => (ctx.body = await createThemePost(ctx.request.body, ctx)));
   router.post('/themes/subscribe', async ctx => (ctx.body = await subscribeToThemePost(ctx.request.body)));
   router.post('/themes/block', async ctx => (ctx.body = await blockThemePost(ctx.request.body)));
   router.post(
      '/themes/subscribe/remove',
      async ctx => (ctx.body = await removeSubscriptionToThemePost(ctx.request.body)),
   );
   router.post(
      '/themes/block/remove',
      async ctx => (ctx.body = await removeBlockToThemePost(ctx.request.body)),
   );
   router.post('/themes/remove', async ctx => (ctx.body = await removeThemesPost(ctx.request.body, ctx)));
}
