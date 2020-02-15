import * as Koa from 'koa';
import { ServerHandshakeResponse } from '../../common-tools/endpoints-interfaces/handshake';
import { versionIsCompatible } from '../../common-tools/string-tools';

export function handshakePost(ctx: Koa.Context) {
   ctx.body = {
      serverOperating: Boolean(process.env.SERVER_OPERATING),
      serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
      versionIsCompatible: versionIsCompatible(
         ctx.request.query.version,
         process.env.MINIMUM_CLIENT_VERSION_ALLOWED,
      ),
   } as ServerHandshakeResponse;
}
