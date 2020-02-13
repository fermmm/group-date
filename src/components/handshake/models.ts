import * as Koa from 'koa';

export function serverOperating(ctx: Koa.Context) {
   const response: ServerHandshakeResponse = {
      ...ctx.body,
      serverOperating: false,
   }
   ctx.body = response;
}

export function validateVersion(ctx: Koa.Context) {
   const response: ServerHandshakeResponse = {
      ...ctx.body,
      versionCompatible: true,
   }
   ctx.body = response;
}

export function serverMessage(ctx: Koa.Context) {
   const response: ServerHandshakeResponse = {
      ...ctx.body,
      serverMessage: "Server not finished",
   }
   ctx.body = response;
}


export interface ServerHandshakeResponse {
   versionCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}