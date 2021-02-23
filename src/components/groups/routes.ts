import * as Router from "@koa/router";
import {
   chatPost,
   dateDayVotePost,
   dateIdeaVotePost,
   feedbackPost,
   groupGet,
   userGroupsGet,
   chatGet,
   voteResultGet,
   chatUnreadAmountGet,
   groupSeenPost,
} from "./models";

export function groupsRoutes(router: Router): void {
   router.get("/group", async ctx => (ctx.body = await groupGet(ctx.request.query, ctx)));
   router.get("/user/groups", async ctx => (ctx.body = await userGroupsGet(ctx.request.query, ctx)));
   router.get("/group/chat", async ctx => (ctx.body = await chatGet(ctx.request.query, ctx)));
   router.get(
      "/group/chat/unread/amount",
      async ctx => (ctx.body = await chatUnreadAmountGet(ctx.request.query, ctx)),
   );
   router.get("/group/votes/result", async ctx => (ctx.body = await voteResultGet(ctx.request.query, ctx)));
   router.post("/group/ideas/vote", async ctx => (ctx.body = await dateIdeaVotePost(ctx.request.body, ctx)));
   router.post("/group/days/vote", async ctx => (ctx.body = await dateDayVotePost(ctx.request.body, ctx)));
   router.post("/group/chat", async ctx => (ctx.body = await chatPost(ctx.request.body, ctx)));
   router.post("/group/seen", async ctx => (ctx.body = await groupSeenPost(ctx.request.body, ctx)));
   router.post("/group/feedback", async ctx => (ctx.body = await feedbackPost(ctx.request.body, ctx)));
}
