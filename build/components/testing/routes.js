"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const configurations_1 = require("../../configurations");
const queries_1 = require("../groups/queries");
const data_conversion_1 = require("../groups/tools/data-conversion");
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
        var _a, _b;
        // let usersDone = 0;
        // const allUsers = await fromQueryToUserList(queryToGetAllUsers(), false, false);
        // for (const user of allUsers) {
        //    await refreshQuestions({ user, ctx, onlyRefreshQuestionIds: ["q05"] });
        //    await refreshQuestions({ user, ctx, onlyRefreshQuestionIds: ["taq-3-v2"] });
        //    usersDone++;
        //    console.log(`done: ${usersDone}/${allUsers.length}`);
        // }
        // console.log("Finished with users");
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
        for (const group of groups) {
            let changeToDo = false;
            if (((_b = (_a = group.chat) === null || _a === void 0 ? void 0 : _a.messages) === null || _b === void 0 ? void 0 : _b.length) > configurations_1.MAX_CHAT_MESSAGES) {
                group.chat.messages.splice(0, group.chat.messages.length - configurations_1.MAX_CHAT_MESSAGES);
                changeToDo = true;
            }
            if (!changeToDo) {
                continue;
            }
            await (0, queries_1.queryToUpdateGroupProperty)({
                groupId: group.groupId,
                chat: group.chat,
            });
        }
        return "done";
    });
}
exports.testingRoutes = testingRoutes;
//# sourceMappingURL=routes.js.map