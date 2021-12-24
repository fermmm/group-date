"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverInfoRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function serverInfoRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/server-info", "GET", models_1.serverInfoGet);
}
exports.serverInfoRoutes = serverInfoRoutes;
//# sourceMappingURL=routes.js.map