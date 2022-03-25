"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveFolderFiles = exports.fileSaverForImages = exports.serveWebsite = void 0;
const mount = require("koa-mount");
const serve = require("koa-static");
const send = require("koa-send");
const koaBody = require("koa-body");
const appRoot = require("app-root-path");
const path = require("path");
const configurations_1 = require("../../configurations");
const general_1 = require("../math-tools/general");
const log_routes_1 = require("../debug-tools/log-routes");
/**
 * This function is garbage. The problem is Koa.js, it's very limited with not much community supporting it.
 * Porting all Koa.js code to Express is something that should be done in this repo.
 */
function serveWebsite(route, websiteFilesPath, app, router, settings) {
    const { enableCache = true, websiteHasRouter } = settings || {};
    app.use(mount(route, (context, next) => serve(websiteFilesPath + "/", enableCache ? { maxage: (0, general_1.hoursToMilliseconds)(24) * 14 } : null)(context, next)));
    const pathsString = [];
    let path = route;
    if (websiteHasRouter) {
        // For some reason only 2 paths deeps are supported by router
        for (let i = 0; i < 2; i++) {
            path += "/:param" + i;
            pathsString.push(path);
        }
        router.get(pathsString, async (ctx) => {
            await send(ctx, `${websiteFilesPath}/index.html`);
        });
    }
}
exports.serveWebsite = serveWebsite;
exports.fileSaverForImages = koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(appRoot.path, "/uploads/"),
        keepExtensions: true,
        maxFileSize: configurations_1.MAX_FILE_SIZE_UPLOAD_ALLOWED,
    },
    onError: (error, ctx) => {
        ctx.throw(400, error);
    },
});
function serveFolderFiles(props) {
    const { localFolderPath, urlToServe, enableCache = true } = props;
    return mount(urlToServe, (context, next) => {
        (0, log_routes_1.imagesLogger)(context);
        return serve(localFolderPath, enableCache ? { maxage: (0, general_1.hoursToMilliseconds)(24) * 360 } : undefined)(context, next);
    });
}
exports.serveFolderFiles = serveFolderFiles;
//# sourceMappingURL=koa-tools.js.map