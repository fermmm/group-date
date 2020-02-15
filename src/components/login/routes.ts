import * as r from 'koa-route';
import { UseFunction } from '../../common-tools/typing-tools';
import { loginPost } from './models';

export function loginRoutes(use: UseFunction): void {
   use(r.post('/login', ctx => ctx.body = loginPost(ctx.request.query)));
}
