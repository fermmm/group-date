"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const queries_1 = require("../groups/queries");
const data_conversion_1 = require("../groups/tools/data-conversion");
const queries_2 = require("../user/queries");
const data_conversion_2 = require("../user/tools/data-conversion");
const models_1 = require("./models");
function testingRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-users", "GET", models_1.createFakeUsersPost);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-tags", "GET", models_1.createFakeTagsPost);
    (0, route_tools_1.createRoute)(r, "/testing/force-groups-search", "GET", models_1.forceGroupSearch);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-chat", "GET", models_1.createFakeChatConversation);
    // TODO: Para que el exportador funcione va a ser necesario encodear las props que ahora fueron agregadas:
    // hay que hacer un migrador que levante todo y lo vuelva a encodear si hace falta, para users y groups
    (0, route_tools_1.createRoute)(r, "/testing/temp", "GET", async (params, ctx) => {
        // await notifyAllUsersAboutNewCards();
        let usersDone = 0;
        const allUsers = await (0, data_conversion_2.fromQueryToUserList)((0, queries_2.queryToGetAllUsers)(), false, false);
        for (const user of allUsers) {
            // await refreshQuestions({ user, ctx, onlyRefreshQuestionIds: ["q05"] });
            // await refreshQuestions({ user, ctx, onlyRefreshQuestionIds: ["taq-3-v2"] });
            await (0, queries_2.queryToUpdateUserProps)(user.token, [
                { key: "notifications", value: user.notifications },
                { key: "requiredTasks", value: user.requiredTasks },
                { key: "questionsResponded", value: user.questionsResponded },
                { key: "banReasons", value: user.banReasons },
            ]);
            usersDone++;
            console.log(`users done: ${usersDone}/${allUsers.length}`);
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
        const groups = await (0, data_conversion_1.fromQueryToGroupList)((0, queries_1.queryToGetAllGroups)());
        let groupsDone = 0;
        for (const group of groups) {
            await (0, queries_1.queryToUpdateGroupProperty)({
                groupId: group.groupId,
                dayOptions: group.dayOptions,
                seenBy: group.seenBy,
                mostVotedIdea: group.mostVotedIdea,
            });
            groupsDone++;
            console.log(`groups done: ${groupsDone}/${groups.length}`);
        }
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map