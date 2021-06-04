// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/ts-tools/globals";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as Router from "@koa/router";
import * as Koa from "koa";
import * as koaBody from "koa-body";
import * as mount from "koa-mount";
import * as ratelimit from "koa-ratelimit";
import * as serve from "koa-static";
import * as cors from "@koa/cors";
import { waitForDatabase } from "./common-tools/database-tools/database-manager";
import { imagesLogger, routesLogger } from "./common-tools/log-tools/log-routes";
import { initializeSecurityTools, rateLimiterConfig } from "./common-tools/security-tools/security-tools";
import { initializeAdmin } from "./components/admin/models";
import { adminRoutes } from "./components/admin/routes";
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
import { userRoutes } from "./components/user/routes";
import { initializeDatabaseBackups } from "./common-tools/database-tools/backups";
import { strToBool } from "./common-tools/string-tools/string-tools";

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router({ prefix: "/api" });

   // Koa middlewares:
   const a = app
      .use(cors({ origin: "*" }))
      .use(ratelimit(rateLimiterConfig))
      .use(koaBody({ parsedMethods: ["GET", "POST"] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(
         mount("/api/images", (context, next) => {
            imagesLogger(context);
            return serve("./uploads/")(context, next);
         }),
      )
      .use(mount("/dashboard", (context, next) => serve("./websites/dashboard/build/")(context, next)))
      .use(mount("/", (context, next) => serve("./websites/promo/")(context, next)));
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

   // Database initialization:
   await waitForDatabase();
   await initializeDatabaseBackups();

   // Initializers that contains scheduled tasks and other initialization stuff
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
   userRoutes(router);
   cardsGameRoutes(router);
   groupsRoutes(router);
   tagsRoutes(router);
   adminRoutes(router);
   testingRoutes(router);

   // Final console messages
   console.log("✓ Server initialized!");
   console.log(`✓ Promo website available in http://localhost:${process.env.PORT}/`);
   console.log(`✓ Api endpoints available in http://localhost:${process.env.PORT}/api`);
   console.log(`✓ Admin dashboard available in http://localhost:${process.env.PORT}/dashboard`);
   if (httpsPortEnabled) {
      console.log(`✓ Also https port enabled: ${process.env.SECONDARY_PORT}`);
   }

   logToFile("Server started", "serverStatus");
})();
