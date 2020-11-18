import * as Router from "@koa/router";
import {
   acceptPost,
   chatPost,
   dateDayVotePost,
   dateIdeaVotePost,
   feedbackPost,
   groupGet,
   userGroupsGet,
} from "./models";

export function groupsRoutes(router: Router): void {
   router.get("/group", async ctx => (ctx.body = await groupGet(ctx.request.body, ctx)));
   router.get("/user/groups", async ctx => (ctx.body = await userGroupsGet(ctx.request.body, ctx)));
   router.post("/group/accept", async ctx => (ctx.body = await acceptPost(ctx.request.body, ctx)));
   router.post("/group/ideas/vote", async ctx => (ctx.body = await dateIdeaVotePost(ctx.request.body, ctx)));
   router.post("/group/days/vote", async ctx => (ctx.body = await dateDayVotePost(ctx.request.body, ctx)));
   router.post("/group/chat", async ctx => (ctx.body = await chatPost(ctx.request.body, ctx)));
   router.post("/group/feedback", async ctx => (ctx.body = await feedbackPost(ctx.request.body, ctx)));
}
