import * as Router from '@koa/router';
import { handshakeGet } from './models';

export function handshakeRoutes(router: Router): void {
   router.get('/handshake', ctx => (ctx.body = handshakeGet(ctx.request.body)));
}
