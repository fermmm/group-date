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
const log_routes_1 = require("./common-tools/debug-tools/log-routes");
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
const routes_8 = require("./components/email-login/routes");
const getServerUrl_1 = require("./common-tools/url-tools/getServerUrl");
const log_1 = require("./common-tools/log-tool/log");
const types_1 = require("./common-tools/log-tool/types");
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
        .use((0, koa_tools_1.serveFolderFiles)({
        localFolderPath: "./websites/email-templates/img/",
        urlToServe: "/email-images",
    }))
        .use((0, routes_1.adminMountedFolders)());
    /**
     * To edit any of these 2 websites directly from chrome dev tools set the first parameter to "/" temporarily,
     * if there is another one with "/" as first parameter comment that one so it does not interfere. Then from
     * chrome dev tools go to Sources > Filesystem and open the corresponding website folder, then click "allow".
     * When you finish editing restore all the temporary changes you made in this file.
     */
    (0, koa_tools_1.serveWebsite)("/", "./websites/promo", a, router);
    (0, koa_tools_1.serveWebsite)("/confirm-email", "./websites/email-login/confirm", a, router, { enableCache: false });
    (0, koa_tools_1.serveWebsite)("/password-reset", "./websites/email-login/password-reset", a, router, { enableCache: false });
    // To edit this website run "npm start" in the websites/dashboard folder and remember to run "npm run build" when finishing editing
    (0, koa_tools_1.serveWebsite)("/dashboard", "./websites/dashboard/build", a, router, { websiteHasRouter: true });
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
    (0, process_tools_1.logEnvironmentMode)();
    // Database initialization:
    await (0, database_manager_1.waitForDatabase)();
    await (0, backups_1.initializeDatabaseBackups)();
    /**
     * Initializers that contains scheduled tasks and other initialization stuff.
     * Important: This is not executed on the tests because this file is not executed
     * there, if you need any of this on the tests you must add it to beforeAllTests.ts.
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
    (0, routes_8.emailLoginRoutes)(router);
    (0, routes_7.userRoutes)(router);
    (0, routes_2.cardsGameRoutes)(router);
    (0, routes_3.groupsRoutes)(router);
    (0, routes_6.tagsRoutes)(router);
    (0, routes_1.adminRoutes)(router);
    (0, routes_5.testingRoutes)(router);
    // Final console messages
    console.log("✓ Server initialized!");
    console.log(`✓ Promo website available in ${(0, getServerUrl_1.getServerUrl)()}/`);
    console.log(`✓ Api endpoints available in ${(0, getServerUrl_1.getServerUrl)()}${configurations_1.USERS_API_PATH}`);
    console.log(`✓ Admin dashboard available in ${(0, getServerUrl_1.getServerUrl)()}/dashboard`);
    if (httpsPortEnabled) {
        console.log(`✓ Also https port enabled`);
    }
    (0, log_1.log)({ serverStatus: "Server started" }, types_1.LogId.ServerStatus);
})();
//# sourceMappingURL=index.js.map