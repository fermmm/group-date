"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagesLogger = exports.routesLogger = void 0;
const configurations_1 = require("../../configurations");
function routesLogger(router) {
    if (!configurations_1.LOG_ROUTE_ACCESS) {
        return;
    }
    router.use("/", async (ctx, next) => {
        console.log("Route requested:", ctx.path, ctx.method);
        await next();
    });
}
exports.routesLogger = routesLogger;
function imagesLogger(context) {
    if (!configurations_1.LOG_IMAGE_ACCESS) {
        return;
    }
    console.log("Image requested:", context.originalUrl);
}
exports.imagesLogger = imagesLogger;
//# sourceMappingURL=log-routes.js.map