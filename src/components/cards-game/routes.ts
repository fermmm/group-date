import * as Router from "@koa/router";
import { dislikedUsersGet, recommendationsFromTagGet, recommendationsGet } from "./models";

export function cardsGameRoutes(router: Router): void {
   router.get(
      "/cards-game/recommendations",
      async ctx => (ctx.body = await recommendationsGet(ctx.request.query, ctx)),
   );
   router.get(
      "/cards-game/disliked-users",
      async ctx => (ctx.body = await dislikedUsersGet(ctx.request.query, ctx)),
   );
   router.get(
      "/cards-game/from-tag",
      async ctx => (ctx.body = await recommendationsFromTagGet(ctx.request.query, ctx)),
   );
}
