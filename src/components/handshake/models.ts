import * as Koa from 'koa';
import { HandshakeParams, ServerHandshakeResponse } from '../../common-tools/endpoints-interfaces/handshake';
import { versionIsCompatible } from '../../common-tools/string-tools';

export function handshakePost(params: HandshakeParams): ServerHandshakeResponse {
   return {
      serverOperating: Boolean(process.env.SERVER_OPERATING),
      serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
      versionIsCompatible: versionIsCompatible(params.version, process.env.MINIMUM_CLIENT_VERSION_ALLOWED),
   };
}
