import { versionIsCompatible } from '../../common-tools/string-tools/string-tools';
import { HandshakeParams, ServerHandshakeResponse } from '../../shared-tools/endpoints-interfaces/handshake';

export function handshakePost(params: HandshakeParams): ServerHandshakeResponse {
   return {
      serverOperating: Boolean(process.env.SERVER_OPERATING),
      serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
      versionIsCompatible: versionIsCompatible(params.version, process.env.MINIMUM_CLIENT_VERSION_ALLOWED),
   };
}
