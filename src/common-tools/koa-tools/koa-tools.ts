import * as Router from "@koa/router";
import * as Koa from "koa";
import * as mount from "koa-mount";
import * as serve from "koa-static";
import * as send from "koa-send";
import * as koaBody from "koa-body";
import * as appRoot from "app-root-path";
import * as path from "path";
import { MAX_FILE_SIZE_UPLOAD_ALLOWED } from "../../configurations";
import { hoursToMilliseconds } from "../math-tools/general";
import { imagesLogger } from "../log-tools/log-routes";

/**
 * This function is garbage. The problem is Koa.js, it's very limited with not much community supporting it.
 * Porting all Koa.js code to Express is something that should be done in this repo.
 */
export function serveWebsite(
   route: string,
   websiteFilesPath: string,
   app: Koa,
   router: Router,
   settings?: { enableCache?: boolean; websiteHasRouter?: boolean },
): void {
   const { enableCache = true, websiteHasRouter } = settings || {};

   app.use(
      mount(route, (context, next) =>
         serve(websiteFilesPath + "/", enableCache ? { maxage: hoursToMilliseconds(24) * 14 } : null)(
            context,
            next,
         ),
      ),
   );

   const pathsString: string[] = [];
   let path: string = route;

   if (websiteHasRouter) {
      // For some reason only 2 paths deeps are supported by router
      for (let i = 0; i < 2; i++) {
         path += "/:param" + i;
         pathsString.push(path);
      }

      router.get(pathsString, async ctx => {
         await send(ctx, `${websiteFilesPath}/index.html`);
      });
   }
}

export const fileSaverForImages = koaBody({
   multipart: true,
   formidable: {
      uploadDir: path.join(appRoot.path, "/uploads/"),
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE_UPLOAD_ALLOWED,
   },
   onError: (error, ctx) => {
      ctx.throw(400, error);
   },
});

export function serveFolderFiles(props: {
   localFolderPath: string;
   urlToServe: string;
   enableCache?: boolean;
}) {
   const { localFolderPath, urlToServe, enableCache = true } = props;

   return mount(urlToServe, (context, next) => {
      imagesLogger(context);
      return serve(localFolderPath, enableCache ? { maxage: hoursToMilliseconds(24) * 360 } : undefined)(
         context,
         next,
      );
   });
}
