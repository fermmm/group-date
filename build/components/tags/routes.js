"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function tagsRoutes(r) {
    route_tools_1.createRoute(r, "/tags", "GET", models_1.tagsGet);
    route_tools_1.createRoute(r, "/tags/created", "GET", models_1.tagsCreatedByUserGet);
    route_tools_1.createRoute(r, "/tags/questions", "GET", models_1.appAuthoredTagsAsQuestionsGet);
    route_tools_1.createRoute(r, "/tags/create", "POST", models_1.createTagPost);
    route_tools_1.createRoute(r, "/tags/subscribe", "POST", models_1.subscribeToTagsPost);
    route_tools_1.createRoute(r, "/tags/block", "POST", models_1.blockTagsPost);
    route_tools_1.createRoute(r, "/tags/subscribe/remove", "POST", models_1.removeSubscriptionToTagsPost);
    route_tools_1.createRoute(r, "/tags/block/remove", "POST", models_1.removeBlockToTagsPost);
    route_tools_1.createRoute(r, "/tags/remove", "POST", models_1.removeTagsPost);
}
exports.tagsRoutes = tagsRoutes;
//# sourceMappingURL=routes.js.map