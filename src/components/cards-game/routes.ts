import * as Router from "@koa/router";
import { dislikedUsersGet, recommendationsFromThemeGet, recommendationsGet } from "./models";

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
      "/cards-game/from-theme",
      async ctx => (ctx.body = await recommendationsFromThemeGet(ctx.request.query, ctx)),
   );
}
