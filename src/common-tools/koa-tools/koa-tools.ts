import * as Router from "@koa/router";
import * as Koa from "koa";
import * as mount from "koa-mount";
import * as serve from "koa-static";
import * as send from "koa-send";

export function serveWebsite(route: string, websiteFilesPath: string, app: Koa, router: Router) {
   app.use(mount(route, (context, next) => serve(websiteFilesPath + "/")(context, next)));

   const pathsString: string[] = [];
   let path: string = route;

   // For some reason only 2 paths deeps are supported by router
   for (let i = 0; i < 2; i++) {
      path += "/:param" + i;
      pathsString.push(path);
   }

   router.get(pathsString, async ctx => {
      await send(ctx, `${websiteFilesPath}/index.html`);
   });
}
