import * as Router from '@koa/router';
import { recommendationsGet } from './models';

export function cardsGameRoutes(router: Router): void {
   router.get('/cards-game/recommendations', async ctx => (ctx.body = await recommendationsGet(ctx.request.body, ctx)));
}
