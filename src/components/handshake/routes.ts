import * as Koa from 'koa';
import * as r from 'koa-route';
import { UseFunction } from '../../index';
import { handshakePost } from './models';

export function handshakeRoutes(use: UseFunction): void {
   use(r.post('/handshake', (ctx) => ctx.body = handshakePost(ctx.request.query)));
}
