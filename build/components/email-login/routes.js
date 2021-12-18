"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLoginRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function emailLoginRoutes(r) {
    route_tools_1.createRoute(r, "/email-login/create-account", "POST", models_1.createAccountPost);
    route_tools_1.createRoute(r, "/email-login/confirm-email", "POST", models_1.confirmEmailPost);
    route_tools_1.createRoute(r, "/email-login/login", "GET", models_1.loginGet);
    route_tools_1.createRoute(r, "/email-login/reset-password", "POST", models_1.resetPasswordPost);
    route_tools_1.createRoute(r, "/email-login/change-password", "POST", models_1.changePasswordPost);
    route_tools_1.createRoute(r, "/email-login/user-exists", "GET", models_1.userExistsGet);
}
exports.emailLoginRoutes = emailLoginRoutes;
//# sourceMappingURL=routes.js.map