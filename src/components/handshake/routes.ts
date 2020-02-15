import * as Koa from 'koa';
import * as r from 'koa-route';
import { handshakePost } from './models';

export function handshakeRoutes(app: Koa): void {
   app.use(r.post('/handshake', ctx => ctx.body = handshakePost(ctx.request.query)));
}
