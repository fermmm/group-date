"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function testingRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-users", "GET", models_1.createFakeUsersPost);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-tags", "GET", models_1.createFakeTagsPost);
    (0, route_tools_1.createRoute)(r, "/testing/force-groups-search", "GET", models_1.forceGroupSearch);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-chat", "GET", models_1.createFakeChatConversation);
    (0, route_tools_1.createRoute)(r, "/testing/temp", "GET", async (params, ctx) => {
        console.time("notify");
        // await notifyAllUsersAboutNewCards();
        console.timeEnd("notify");
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map