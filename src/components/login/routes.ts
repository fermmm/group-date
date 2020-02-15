import * as Koa from 'koa';
import * as r from 'koa-route';
import { loginPost } from './models';

export function loginRoutes(app: Koa): void {
   app.use(r.post('/login', ctx => ctx.body = loginPost(ctx.request.query)));
}
