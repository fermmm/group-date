// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/log-tools/winstonLogger";
import * as Router from "@koa/router";
import * as Koa from "koa";
import * as koaBody from "koa-body";
import * as mount from "koa-mount";
import * as ratelimit from "koa-ratelimit";
import * as serve from "koa-static";
import * as cors from "@koa/cors";
import * as ora from "ora";
import { waitForDatabase } from "./common-tools/database-tools/database-manager";
import { imagesLogger, routesLogger } from "./common-tools/log-tools/log-routes";
import { rateLimiterConfig } from "./common-tools/security-tools/security-tools";
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

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router();
   router.get("/", ctx => {
      ctx.body = "Poly Dates server";
   });

   // Koa middlewares:
   const a = app
      .use(cors({ origin: "*" }))
      .use(ratelimit(rateLimiterConfig))
      .use(koaBody({ parsedMethods: ["GET", "POST"] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(
         mount("/images", (context, next) => {
            imagesLogger(context);
            return serve("./uploads/")(context, next);
         }),
      )
      .listen(process.env.PORT);

   // Database initialization:
   await waitForDatabase();

   // Initializers that contains scheduled tasks and other initialization stuff
   await initializeAdmin();
   await initializeUsers();
   await initializeGroups();
   await initializeCardsGame();
   await initializeGroupsFinder();
   await initializeTags();

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

   // Final messages
   ora("Application initialized!").succeed();
   ora(`Server running on ${process.env.PORT}!`).succeed();

   logToFile("Server started", "serverStatus");
})();
