import * as r from 'koa-route';
import { UseFunction } from '../../common-tools/typing-tools';
import { handshakePost } from './models';

export function handshakeRoutes(use: UseFunction): void {
   use(r.post('/handshake', ctx => ctx.body = handshakePost(ctx.request.query)));
}
