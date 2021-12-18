"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMountedFolders = exports.adminRoutes = void 0;
const mount = require("koa-mount");
const serve = require("koa-static");
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const configurations_1 = require("../../configurations");
const models_1 = require("./models");
const validateAdminCredentials_1 = require("./tools/validateAdminCredentials");
function adminRoutes(r) {
    route_tools_1.createRoute(r, "/admin/validate/credentials", "GET", models_1.validateCredentialsGet);
    route_tools_1.createRoute(r, "/admin/chat", "GET", models_1.adminChatGet);
    route_tools_1.createRoute(r, "/admin/chat", "POST", models_1.adminChatPost);
    route_tools_1.createRoute(r, "/admin/chat/all", "GET", models_1.allChatsWithAdminsGet);
    route_tools_1.createRoute(r, "/admin/logs/files", "GET", models_1.logFileListGet);
    route_tools_1.createRoute(r, "/admin/log", "GET", models_1.logGet);
    route_tools_1.createRoute(r, "/admin/convert", "POST", models_1.convertToAdminPost);
    route_tools_1.createRoute(r, "/admin/db/import", "POST", models_1.importDatabasePost);
    route_tools_1.createRoute(r, "/admin/db/export", "GET", models_1.exportDatabaseGet);
    route_tools_1.createRoute(r, "/admin/db/visualizer", "POST", models_1.visualizerPost);
    route_tools_1.createRoute(r, "/admin/send-notifications", "POST", models_1.adminNotificationSendPost);
    route_tools_1.createRoute(r, "/admin/command", "POST", models_1.runCommandPost);
    route_tools_1.createRoute(r, "/admin/email", "POST", models_1.sendEmailPost);
    route_tools_1.createRoute(r, "/admin/user/ban", "POST", models_1.banUserPost);
    route_tools_1.createRoute(r, "/admin/user/remove-ban", "POST", models_1.removeBanFromUserPost);
    route_tools_1.createRoute(r, "/admin/user/remove-all-bans", "POST", models_1.removeAllBanReasonsFromUser);
    r.post(`${configurations_1.USERS_API_PATH}/admin/upload-file`, models_1.onAdminFileReceived, async (ctx) => (ctx.body = await models_1.onAdminFileSaved(ctx.request.files, ctx)));
}
exports.adminRoutes = adminRoutes;
function adminMountedFolders() {
    return mount("/api/admin-uploads", async (context, next) => {
        const validationResult = await validateAdminCredentials_1.validateAdminCredentials({ hash: context.request.query.hash });
        if (!validationResult.isValid) {
            return;
        }
        return serve("./admin-uploads/")(context, next);
    });
}
exports.adminMountedFolders = adminMountedFolders;
//# sourceMappingURL=routes.js.map