// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/ts-tools/globals";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as Router from "@koa/router";
import * as Koa from "koa";
import * as koaBody from "koa-body";
import * as cors from "@koa/cors";
import { waitForDatabase } from "./common-tools/database-tools/database-manager";
import { routesLogger } from "./common-tools/debug-tools/log-routes";
import { initializeSecurityTools, rateLimiterConfig } from "./common-tools/security-tools/security-tools";
import { initializeAdmin } from "./components/admin/models";
import { adminMountedFolders, adminRoutes } from "./components/admin/routes";
import { initializeCardsGame } from "./components/cards-game/models";
import { cardsGameRoutes } from "./components/cards-game/routes";
import { initializeGroupsFinder } from "./components/groups-finder/models";
import { initializeGroups } from "./components/groups/models";
import { groupsRoutes } from "./components/groups/routes";
import { serverInfoRoutes } from "./components/server-info/routes";
import { testingRoutes } from "./components/testing/routes";
import { initializeTags } from "./components/tags/models";
import { tagsRoutes } from "./components/tags/routes";
import { initializeUsers } from "./components/user/models";
import { userMountedFolders, userRoutes } from "./components/user/routes";
import { initializeDatabaseBackups } from "./common-tools/database-tools/backups";
import { strToBool } from "./common-tools/string-tools/string-tools";
import { logEnvironmentMode } from "./common-tools/process/process-tools";
import { serveFolderFiles, serveWebsite } from "./common-tools/koa-tools/koa-tools";
import { USERS_API_PATH } from "./configurations";
import { emailLoginRoutes } from "./components/email-login/routes";
import { getServerUrl } from "./common-tools/url-tools/getServerUrl";
import { log } from "./common-tools/log-tool/log";
import { LogId } from "./common-tools/log-tool/types";

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router();

   // Koa middlewares:
   const a = app
      .use(cors({ origin: "*" }))
      // This may not work with AWS because all the requests comes from the load balancer
      // .use(ratelimit(rateLimiterConfig))
      .use(koaBody({ parsedMethods: ["GET", "POST"] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(userMountedFolders())
      .use(
         serveFolderFiles({
            localFolderPath: "./websites/email-templates/img/",
            urlToServe: "/email-images",
         }),
      )
      .use(adminMountedFolders());

   /**
    * To edit any of these 2 websites directly from chrome dev tools set the first parameter to "/" temporarily,
    * if there is another one with "/" as first parameter comment that one so it does not interfere. Then from
    * chrome dev tools go to Sources > Filesystem and open the corresponding website folder, then click "allow".
    * When you finish editing restore all the temporary changes you made in this file.
    */
   serveWebsite("/", "./websites/promo", a, router);
   serveWebsite("/confirm-email", "./websites/email-login/confirm", a, router, { enableCache: false });
   serveWebsite("/password-reset", "./websites/email-login/password-reset", a, router, { enableCache: false });

   // To edit this website run "npm start" in the websites/dashboard folder and remember to run "npm run build" when finishing editing
   serveWebsite("/dashboard", "./websites/dashboard/build", a, router, { websiteHasRouter: true });

   const appCallback = app.callback();

   http.createServer(appCallback).listen(process.env.PORT);
   const httpsPortEnabled = strToBool(process.env.HTTPS_PORT_ENABLED);
   if (httpsPortEnabled) {
      https
         .createServer(
            {
               cert: fs.readFileSync(process.env.HTTPS_CERTIFICATE_PATH),
               key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
            },
            appCallback,
         )
         .listen(443);
   }

   logEnvironmentMode();

   // Database initialization:
   await waitForDatabase();
   await initializeDatabaseBackups();

   /**
    * Initializers that contains scheduled tasks and other initialization stuff.
    * Important: This is not executed on the tests because this file is not executed
    * there, if you need any of this on the tests you must add it to beforeAllTests.ts.
    */
   await initializeUsers();
   await initializeGroups();
   await initializeCardsGame();
   await initializeGroupsFinder();
   await initializeTags();
   await initializeAdmin();
   await initializeSecurityTools();

   // Debugging tools:
   routesLogger(router);

   // Routes:
   serverInfoRoutes(router);
   testingRoutes(router);
   adminRoutes(router);
   emailLoginRoutes(router);
   userRoutes(router);
   cardsGameRoutes(router);
   groupsRoutes(router);
   tagsRoutes(router);

   // Final console messages
   console.log("✓ Server initialized!");
   console.log(`✓ Promo website available in ${getServerUrl()}/`);
   console.log(`✓ Api endpoints available in ${getServerUrl()}${USERS_API_PATH}`);
   console.log(`✓ Admin dashboard available in ${getServerUrl()}/dashboard`);
   if (httpsPortEnabled) {
      console.log(`✓ Also https port enabled`);
   }

   log({ serverStatus: "Server started" }, LogId.ServerStatus);
})();
