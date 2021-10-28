"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
require("./common-tools/ts-tools/globals");
const http = require("http");
const https = require("https");
const fs = require("fs");
const Router = require("@koa/router");
const Koa = require("koa");
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const database_manager_1 = require("./common-tools/database-tools/database-manager");
const log_routes_1 = require("./common-tools/log-tools/log-routes");
const security_tools_1 = require("./common-tools/security-tools/security-tools");
const models_1 = require("./components/admin/models");
const routes_1 = require("./components/admin/routes");
const models_2 = require("./components/cards-game/models");
const routes_2 = require("./components/cards-game/routes");
const models_3 = require("./components/groups-finder/models");
const models_4 = require("./components/groups/models");
const routes_3 = require("./components/groups/routes");
const routes_4 = require("./components/server-info/routes");
const routes_5 = require("./components/testing/routes");
const models_5 = require("./components/tags/models");
const routes_6 = require("./components/tags/routes");
const models_6 = require("./components/user/models");
const routes_7 = require("./components/user/routes");
const backups_1 = require("./common-tools/database-tools/backups");
const string_tools_1 = require("./common-tools/string-tools/string-tools");
const process_tools_1 = require("./common-tools/process/process-tools");
const koa_tools_1 = require("./common-tools/koa-tools/koa-tools");
const configurations_1 = require("./configurations");
(async () => {
    // Koa initialization:
    const app = new Koa();
    const router = new Router();
    // Koa middlewares:
    const a = app
        .use(cors({ origin: "*" }))
        // This may not work with AWS because all the requests comes from the load balancer
        // .use(ratelimit(rateLimiterConfig))
        .use(koaBody({ parsedMethods: ["GET", "POST"] }))
        .use(router.routes())
        .use(router.allowedMethods())
        .use((0, routes_7.userMountedFolders)())
        .use((0, routes_1.adminMountedFolders)());
    (0, koa_tools_1.serveWebsite)("/", "./websites/promo", a, router);
    (0, koa_tools_1.serveWebsite)("/dashboard", "./websites/dashboard/build", a, router);
    const appCallback = app.callback();
    http.createServer(appCallback).listen(process.env.PORT);
    const httpsPortEnabled = (0, string_tools_1.strToBool)(process.env.HTTPS_PORT_ENABLED);
    if (httpsPortEnabled) {
        https
            .createServer({
            cert: fs.readFileSync(process.env.HTTPS_CERTIFICATE_PATH),
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
        }, appCallback)
            .listen(443);
    }
    console.log("");
    (0, process_tools_1.logEnvironmentMode)();
    // Database initialization:
    await (0, database_manager_1.waitForDatabase)();
    await (0, backups_1.initializeDatabaseBackups)();
    /**
     * Initializers that contains scheduled tasks and other initialization stuff.
     * Important: This is not executed on the tests unless you add it to beforeAllTests.ts, if
     * you add new initialization logic make sure it's also executed on the tests.
     */
    await (0, models_6.initializeUsers)();
    await (0, models_4.initializeGroups)();
    await (0, models_2.initializeCardsGame)();
    await (0, models_3.initializeGroupsFinder)();
    await (0, models_5.initializeTags)();
    await (0, models_1.initializeAdmin)();
    await (0, security_tools_1.initializeSecurityTools)();
    // Debugging tools:
    (0, log_routes_1.routesLogger)(router);
    // Routes:
    (0, routes_4.serverInfoRoutes)(router);
    (0, routes_7.userRoutes)(router);
    (0, routes_2.cardsGameRoutes)(router);
    (0, routes_3.groupsRoutes)(router);
    (0, routes_6.tagsRoutes)(router);
    (0, routes_1.adminRoutes)(router);
    (0, routes_5.testingRoutes)(router);
    // Final console messages
    console.log("✓ Server initialized!");
    console.log(`✓ Promo website available in http://localhost:${process.env.PORT}/`);
    console.log(`✓ Api endpoints available in http://localhost:${process.env.PORT}${configurations_1.USERS_API_PATH}`);
    console.log(`✓ Admin dashboard available in http://localhost:${process.env.PORT}/dashboard`);
    if (httpsPortEnabled) {
        console.log(`✓ Also https port enabled`);
    }
    logToFile("Server started", "serverStatus");
})();
//# sourceMappingURL=index.js.map