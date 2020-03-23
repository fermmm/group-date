import * as Router from '@koa/router';
import { handshakePost } from './models';

export function handshakeRoutes(router: Router): void {
   router.post('/handshake', ctx => (ctx.body = handshakePost(ctx.request.body)));
}
