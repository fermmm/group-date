import * as Router from '@koa/router';
import { dislikedUsersGet, recommendationsGet } from './models';

export function cardsGameRoutes(router: Router): void {
   router.get(
      '/cards-game/recommendations',
      async ctx => (ctx.body = await recommendationsGet(ctx.request.body, ctx)),
   );
   router.get(
      '/cards-game/disliked-users',
      async ctx => (ctx.body = await dislikedUsersGet(ctx.request.body, ctx)),
   );
}
