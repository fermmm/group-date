import * as Router from "@koa/router";
import { serverInfoGet } from "./models";

export function serverInfoRoutes(router: Router): void {
   router.get("/server-info", ctx => (ctx.body = serverInfoGet(ctx.request.query, ctx)));
}
