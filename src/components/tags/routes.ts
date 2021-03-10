import * as Router from "@koa/router";
import {
   blockTagPost,
   createTagPost,
   removeTagsPost,
   subscribeToTagPost,
   tagsGet,
   tagsCreatedByUserGet,
   removeSubscriptionToTagPost,
   removeBlockToTagPost,
   appAuthoredTagsAsQuestionsGet,
} from "./models";

export function tagsRoutes(router: Router): void {
   router.get("/tags", async ctx => (ctx.body = await tagsGet(ctx.request.query, ctx)));
   router.get("/tags/created", async ctx => (ctx.body = await tagsCreatedByUserGet(ctx.request.query)));
   router.get("/tags/questions", async ctx => (ctx.body = appAuthoredTagsAsQuestionsGet(ctx)));
   router.post("/tags/create", async ctx => (ctx.body = await createTagPost(ctx.request.body, ctx)));
   router.post("/tags/subscribe", async ctx => (ctx.body = await subscribeToTagPost(ctx.request.body)));
   router.post("/tags/block", async ctx => (ctx.body = await blockTagPost(ctx.request.body)));
   router.post(
      "/tags/subscribe/remove",
      async ctx => (ctx.body = await removeSubscriptionToTagPost(ctx.request.body)),
   );
   router.post("/tags/block/remove", async ctx => (ctx.body = await removeBlockToTagPost(ctx.request.body)));
   router.post("/tags/remove", async ctx => (ctx.body = await removeTagsPost(ctx.request.body, ctx)));
}
