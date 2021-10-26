import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { USERS_API_PATH } from "../../configurations";

export function createRoute<Params, Response>(
   router: Router,
   path: string,
   method: Method,
   fn: EndpointFunction<Params, Response>,
) {
   path = USERS_API_PATH + path;

   if (method === "GET") {
      router.get(path, async ctx => (ctx.body = await fn(ctx.request.query as unknown as Params, ctx)));
   }

   if (method === "POST") {
      router.post(path, async ctx => (ctx.body = await fn(ctx.request.body as Params, ctx)));
   }

   if (method === "PUT") {
      router.put(path, async ctx => (ctx.body = await fn(ctx.request.body as Params, ctx)));
   }

   if (method === "PATCH") {
      router.patch(path, async ctx => (ctx.body = await fn(ctx.request.body as Params, ctx)));
   }

   if (method === "DELETE") {
      router.del(path, async ctx => (ctx.body = await fn(ctx.request.body as Params, ctx)));
   }

   if (method === "ALL") {
      router.all(
         path,
         async ctx =>
            (ctx.body = await fn(
               (ctx.request.query as unknown as Params) ?? (ctx.request.body as Params),
               ctx,
            )),
      );
   }
}

export type Method = "POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "ALL";
export type EndpointFunction<Params, Response> = (
   params: Params,
   ctx: BaseContext,
) => Response | Promise<Response>;
