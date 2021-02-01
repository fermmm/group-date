import { LOG_IMAGE_ACCESS, LOG_ROUTE_ACCESS } from "./../../configurations";
import * as Router from "@koa/router";

export function routesLogger(router: Router) {
   if (!LOG_ROUTE_ACCESS) {
      return;
   }

   router.use("/", async (ctx, next) => {
      console.log("Route requested:", ctx.path);
      await next();
   });
}

export function imagesLogger(context: { originalUrl: string }) {
   if (!LOG_IMAGE_ACCESS) {
      return;
   }
   console.log("Image requested:", context.originalUrl);
}
