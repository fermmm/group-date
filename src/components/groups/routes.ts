import * as Router from '@koa/router';
import { acceptPost, chatPost, feedbackPost, groupGet, userGroupsGet, votePost } from './models';

export function groupsRoutes(router: Router): void {
   router.get('/groups', async ctx => (ctx.body = await groupGet(ctx.request.body, ctx)));
   router.get('/user/groups', async ctx => (ctx.body = await userGroupsGet(ctx.request.body, ctx)));
   router.post('/groups/accept', async ctx => (ctx.body = await acceptPost(ctx.request.body, ctx)));
   router.post('/groups/vote', async ctx => (ctx.body = await votePost(ctx.request.body, ctx)));
   router.post('/groups/chat', async ctx => (ctx.body = await chatPost(ctx.request.body, ctx)));
   router.post('/groups/feedback', async ctx => (ctx.body = await feedbackPost(ctx.request.body, ctx)));
}
