import * as Router from '@koa/router';
import { acceptPost, chatGet, chatPost, votePost } from './models';

export function groupsRoutes(router: Router): void {
   router.post('/groups/accept', async ctx => (ctx.body = await acceptPost(ctx.request.body, ctx)));
   router.post('/groups/vote', async ctx => (ctx.body = await votePost(ctx.request.body, ctx)));
   router.get('/groups/chat', async ctx => (ctx.body = await chatGet(ctx.request.body, ctx)));
   router.post('/groups/chat', async ctx => (ctx.body = await chatPost(ctx.request.body, ctx)));
}
