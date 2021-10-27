"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const queries_1 = require("../user/queries");
const data_conversion_1 = require("../user/tools/data-conversion");
const models_1 = require("./models");
function testingRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-users", "GET", models_1.createFakeUsersPost);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-tags", "GET", models_1.createFakeTagsPost);
    (0, route_tools_1.createRoute)(r, "/testing/force-groups-search", "GET", models_1.forceGroupSearch);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-chat", "GET", models_1.createFakeChatConversation);
    (0, route_tools_1.createRoute)(r, "/testing/temp", "GET", async (params, ctx) => {
        var _a;
        console.time("notify");
        // await notifyAllUsersAboutNewCards();
        const allUsers = await (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetAllCompleteUsers)(), false, false);
        for (const user of allUsers) {
            if (((_a = user.images) === null || _a === void 0 ? void 0 : _a.length) != null) {
                let query = (0, queries_1.queryToGetUserByToken)(user.token);
                query = query.property("imagesAmount", user.images.length);
                await (0, database_manager_1.sendQuery)(() => query.iterate());
            }
        }
        console.log("Done");
        console.timeEnd("notify");
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map