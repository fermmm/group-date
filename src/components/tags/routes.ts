import * as Router from "@koa/router";
import {
   blockTagsPost,
   createTagPost,
   removeTagsPost,
   subscribeToTagsPost,
   tagsGet,
   tagsCreatedByUserGet,
   removeSubscriptionToTagsPost,
   removeBlockToTagsPost,
   appAuthoredTagsAsQuestionsGet,
} from "./models";

export function tagsRoutes(router: Router): void {
   router.get("/tags", async ctx => (ctx.body = await tagsGet(ctx.request.query, ctx)));
   router.get("/tags/created", async ctx => (ctx.body = await tagsCreatedByUserGet(ctx.request.query)));
   router.get("/tags/questions", async ctx => (ctx.body = appAuthoredTagsAsQuestionsGet(ctx)));
   router.post("/tags/create", async ctx => (ctx.body = await createTagPost(ctx.request.body, ctx)));
   router.post("/tags/subscribe", async ctx => (ctx.body = await subscribeToTagsPost(ctx.request.body)));
   router.post("/tags/block", async ctx => (ctx.body = await blockTagsPost(ctx.request.body)));
   router.post(
      "/tags/subscribe/remove",
      async ctx => (ctx.body = await removeSubscriptionToTagsPost(ctx.request.body)),
   );
   router.post("/tags/block/remove", async ctx => (ctx.body = await removeBlockToTagsPost(ctx.request.body)));
   router.post("/tags/remove", async ctx => (ctx.body = await removeTagsPost(ctx.request.body, ctx)));
}
