import * as Koa from 'koa';

export function serverOperating(ctx: Koa.Context) {
   // TODO: Estaria bueno que haya un tipado funcionando aca
   ctx.body = {
      ...ctx.body,
      serverOperating: false,
   } as ServerHandshakeResponse;
}

export function validateVersion(ctx: Koa.Context) {
   ctx.body = {
      ...ctx.body,
      versionCompatible: true,
   } as ServerHandshakeResponse;
}

export function serverMessage(ctx: Koa.Context) {
   ctx.body = {
      ...ctx.body,
      serverMessage: "Server not finished",
   } as ServerHandshakeResponse;
}


export interface ServerHandshakeResponse {
   versionCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}