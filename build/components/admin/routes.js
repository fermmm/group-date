"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const configurations_1 = require("../../configurations");
const models_1 = require("./models");
function adminRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/admin/validate/credentials", "GET", models_1.validateCredentialsGet);
    (0, route_tools_1.createRoute)(r, "/admin/chat", "GET", models_1.adminChatGet);
    (0, route_tools_1.createRoute)(r, "/admin/chat", "POST", models_1.adminChatPost);
    (0, route_tools_1.createRoute)(r, "/admin/chat/all", "GET", models_1.allChatsWithAdminsGet);
    (0, route_tools_1.createRoute)(r, "/admin/logs/files", "GET", models_1.logFileListGet);
    (0, route_tools_1.createRoute)(r, "/admin/log", "GET", models_1.logGet);
    (0, route_tools_1.createRoute)(r, "/admin/convert", "POST", models_1.convertToAdminPost);
    (0, route_tools_1.createRoute)(r, "/admin/db/loadcsv", "POST", models_1.loadCsvPost);
    (0, route_tools_1.createRoute)(r, "/admin/db/visualizer", "POST", models_1.visualizerPost);
    (0, route_tools_1.createRoute)(r, "/admin/send-notifications", "POST", models_1.adminNotificationSendPost);
    (0, route_tools_1.createRoute)(r, "/admin/command", "POST", models_1.runCommandPost);
    r.post(`${configurations_1.USERS_API_PATH}/admin/upload-file`, models_1.onAdminFileReceived, async (ctx) => (ctx.body = await (0, models_1.onAdminFileSaved)(ctx.request.files, ctx)));
}
exports.adminRoutes = adminRoutes;
//# sourceMappingURL=routes.js.map