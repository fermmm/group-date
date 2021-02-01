import { LOG_ROUTES } from "./../../configurations";
import * as Router from "@koa/router";

export function routesLogger(router: Router) {
   if (!LOG_ROUTES) {
      return;
   }

   router.use("/", async (ctx, next) => {
      console.log(ctx.path);
      await next();
   });
}
