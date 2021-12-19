"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("../groups/models");
const queries_1 = require("../groups/queries");
const data_conversion_1 = require("../groups/tools/data-conversion");
const queries_2 = require("../user/queries");
const data_conversion_2 = require("../user/tools/data-conversion");
const models_2 = require("./models");
function testingRoutes(r) {
    route_tools_1.createRoute(r, "/testing/create-fake-users", "GET", models_2.createFakeUsersPost);
    route_tools_1.createRoute(r, "/testing/create-fake-tags", "GET", models_2.createFakeTagsPost);
    route_tools_1.createRoute(r, "/testing/force-groups-search", "GET", models_2.forceGroupSearch);
    route_tools_1.createRoute(r, "/testing/create-fake-chat", "GET", models_2.createFakeChatConversation);
    route_tools_1.createRoute(r, "/testing/temp", "GET", async (params, ctx) => {
        console.time("notify");
        // await notifyAllUsersAboutNewCards();
        // const allUsers = await fromQueryToUserList(queryToGetAllCompleteUsers(), false, false);
        // for (const user of allUsers) {
        //    if (user.images?.length != null) {
        //       let query = queryToGetUserByToken(user.token);
        //       query = query.property("imagesAmount", user.images.length);
        //       await sendQuery(() => query.iterate());
        //    }
        // }
        // console.log("Done");
        // console.timeEnd("notify");
        const user = await data_conversion_2.fromQueryToUser(queries_2.queryToGetAllUsers().has("name", "fer"), false);
        const groups = await data_conversion_1.fromQueryToGroupList(queries_1.queryToGetAllGroupsOfUser(user.token));
        await models_1.sendNewGroupNotification(user.userId, groups[0]);
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map