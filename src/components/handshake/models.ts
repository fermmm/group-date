import * as Koa from 'koa';

export interface ServerHandshakeResponse {
   versionCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}

export function handshakePost(ctx: Koa.Context) {
   ctx.body = {
      serverOperating: true,
      serverMessage: "",
      versionCompatible: versionIsCompatible(ctx.request.query.version),
   } as ServerHandshakeResponse;
}

function versionIsCompatible(version: string): boolean {
   const min: string[] = process.env.MINIMUM_CLIENT_VERSION_ALLOWED.split(".");
   const current: string[] = version.split(".");

   for (let i = 0; i < min.length; i++) {
      if (current[i] < min[i]) {
         return false;
      }
   
      if (current[i] > min[i]) {
         return true;
      }
   }

   return true;
}
