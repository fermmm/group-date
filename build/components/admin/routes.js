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
    (0, route_tools_1.createRoute)(r, "/admin/validate/credentials", "GET", models_1.validateCredentialsGet);
    (0, route_tools_1.createRoute)(r, "/admin/chat", "GET", models_1.adminChatGet);
    (0, route_tools_1.createRoute)(r, "/admin/chat", "POST", models_1.adminChatPost);
    (0, route_tools_1.createRoute)(r, "/admin/chat/all", "GET", models_1.allChatsWithAdminsGet);
    (0, route_tools_1.createRoute)(r, "/admin/logs/files", "GET", models_1.logFileListGet);
    (0, route_tools_1.createRoute)(r, "/admin/log", "GET", models_1.logGet);
    (0, route_tools_1.createRoute)(r, "/admin/convert", "POST", models_1.convertToAdminPost);
    (0, route_tools_1.createRoute)(r, "/admin/db/import", "POST", models_1.importDatabasePost);
    (0, route_tools_1.createRoute)(r, "/admin/db/export", "GET", models_1.exportDatabaseGet);
    (0, route_tools_1.createRoute)(r, "/admin/db/visualizer", "POST", models_1.visualizerPost);
    (0, route_tools_1.createRoute)(r, "/admin/db/query", "POST", models_1.queryPost);
    (0, route_tools_1.createRoute)(r, "/admin/db/delete", "POST", models_1.deleteDbPost);
    (0, route_tools_1.createRoute)(r, "/admin/send-notifications", "POST", models_1.adminNotificationSendPost);
    (0, route_tools_1.createRoute)(r, "/admin/notification-status", "GET", models_1.notificationStatusGet);
    (0, route_tools_1.createRoute)(r, "/admin/command", "POST", models_1.runCommandPost);
    (0, route_tools_1.createRoute)(r, "/admin/email", "POST", models_1.sendEmailPost);
    (0, route_tools_1.createRoute)(r, "/admin/group", "GET", models_1.getGroup);
    (0, route_tools_1.createRoute)(r, "/admin/user/ban", "POST", models_1.banUserPost);
    (0, route_tools_1.createRoute)(r, "/admin/user/remove-ban", "POST", models_1.removeBanFromUserPost);
    (0, route_tools_1.createRoute)(r, "/admin/user/remove-all-bans", "POST", models_1.removeAllBanReasonsFromUser);
    r.post(`${configurations_1.USERS_API_PATH}/admin/upload-file`, models_1.onAdminFileReceived, async (ctx) => (ctx.body = await (0, models_1.onAdminFileSaved)(ctx.request.files, ctx)));
}
exports.adminRoutes = adminRoutes;
function adminMountedFolders() {
    return mount("/api/admin-uploads", async (context, next) => {
        const validationResult = await (0, validateAdminCredentials_1.validateAdminCredentials)({ hash: context.request.query.hash });
        if (!validationResult.isValid) {
            return;
        }
        return serve("./admin-uploads/")(context, next);
    });
}
exports.adminMountedFolders = adminMountedFolders;
//# sourceMappingURL=routes.js.map