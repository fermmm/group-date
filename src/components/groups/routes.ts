import * as Router from '@koa/router';
import { acceptPost, chatGet, chatPost, votePost } from './models';

export function groupsRoutes(router: Router): void {
   router.post('/groups/accept', ctx => (ctx.body = acceptPost()));
   router.post('/groups/vote', ctx => (ctx.body = votePost()));
   router.get('/groups/chat', ctx => (ctx.body = chatGet()));
   router.post('/groups/chat', ctx => (ctx.body = chatPost()));
}
