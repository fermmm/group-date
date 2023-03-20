"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
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
        // await notifyAllUsersAboutNewCards();
        console.log("Starting migration");
        let usersDone = 0;
        const allUsers = await (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetAllUsers)({ includeDemoAccounts: true }), false, false);
        console.log("Users list ok: " + allUsers.length + " users");
        for (const user of allUsers) {
            let requiredTasksToSend = (0, data_conversion_tools_1.serializeIfNeeded)((_a = user.requiredTasks) !== null && _a !== void 0 ? _a : []);
            requiredTasksToSend = (0, data_conversion_tools_1.encodeIfNeeded)(requiredTasksToSend, "requiredTasks", "user");
            await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserByToken)(user.token)
                .property(database_manager_1.cardinality.single, "requiredTasks", requiredTasksToSend)
                .iterate());
            usersDone++;
            console.log(`done: ${usersDone}/${allUsers.length}`);
        }
        console.log("Finished with users");
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
        // const groups = await fromQueryToGroupList(queryToGetAllGroups());
        // for (const group of groups) {
        //    for (const member of group.members) {
        //       await sendNewGroupNotification(member.userId, group);
        //    }
        // }
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map