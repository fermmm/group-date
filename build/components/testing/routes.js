"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
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
        // await notifyAllUsersAboutNewCards();
        let usersDone = 0;
        const allUsers = await (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetAllUsers)(), false, false);
        for (const user of allUsers) {
            await (0, models_1.refreshQuestions)({ user, ctx, onlyRefreshQuestionIds: ["q05"] });
            await (0, models_1.refreshQuestions)({ user, ctx, onlyRefreshQuestionIds: ["taq-3-v2"] });
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