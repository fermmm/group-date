"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLoginRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function emailLoginRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/email-login/create-account", "POST", models_1.createAccountPost);
    (0, route_tools_1.createRoute)(r, "/email-login/confirm-email", "POST", models_1.confirmEmailPost);
    (0, route_tools_1.createRoute)(r, "/email-login/login", "GET", models_1.loginGet);
    (0, route_tools_1.createRoute)(r, "/email-login/reset-password", "POST", models_1.resetPasswordPost);
    (0, route_tools_1.createRoute)(r, "/email-login/change-password", "POST", models_1.changePasswordPost);
    (0, route_tools_1.createRoute)(r, "/email-login/user-exists", "GET", models_1.userExistsGet);
}
exports.emailLoginRoutes = emailLoginRoutes;
//# sourceMappingURL=routes.js.map