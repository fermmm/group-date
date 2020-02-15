import * as Koa from 'koa';
import { ServerLoginResponse } from '../../common-tools/endpoints-interfaces/login';

export function loginPost(ctx: Koa.Context) {
   ctx.body = {} as ServerLoginResponse;
}


