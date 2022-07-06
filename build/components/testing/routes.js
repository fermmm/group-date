"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingRoutes = void 0;
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const encodeString_1 = require("../../shared-tools/utility-functions/encodeString");
const group_1 = require("../../shared-tools/validators/group");
const tags_1 = require("../../shared-tools/validators/tags");
const user_1 = require("../../shared-tools/validators/user");
const replacements_1 = require("../../tests/tools/replacements");
const queries_1 = require("../groups/queries");
const data_conversion_1 = require("../groups/tools/data-conversion");
const data_conversion_2 = require("../tags/tools/data-conversion");
const models_1 = require("../user/models");
const queries_2 = require("../user/queries");
const data_conversion_3 = require("../user/tools/data-conversion");
const models_2 = require("./models");
function testingRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-users", "GET", models_2.createFakeUsersPost);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-tags", "GET", models_2.createFakeTagsPost);
    (0, route_tools_1.createRoute)(r, "/testing/force-groups-search", "GET", models_2.forceGroupSearch);
    (0, route_tools_1.createRoute)(r, "/testing/create-fake-chat", "GET", models_2.createFakeChatConversation);
    (0, route_tools_1.createRoute)(r, "/testing/temp", "GET", async (params, ctx) => {
        console.time("start");
        /**
         * ENCODE USER DATA
         */
        const allUsers = await (0, data_conversion_3.fromQueryToUserList)((0, queries_2.queryToGetAllUsers)({ includeDemoAccounts: true }), false, false);
        let amountDone = 0;
        for (const user of allUsers) {
            let traversal = (0, queries_2.queryToGetUserByToken)(user.token);
            console.log(`done: ${amountDone}/${allUsers.length}`);
            amountDone++;
            for (const propName of user_1.USER_PROPS_TO_ENCODE_AS_ARRAY) {
                if (user[propName] == null) {
                    continue;
                }
                traversal = traversal.property(database_manager_1.cardinality.single, propName, (0, encodeString_1.encodeString)((0, data_conversion_tools_1.serializeIfNeeded)(user[propName])));
            }
            await (0, database_manager_1.sendQuery)(() => traversal.iterate());
        }
        console.log("Finished with users");
        /**
         * ENCODE GROUP DATA
         */
        const allGroups = await (0, data_conversion_1.fromQueryToGroupList)((0, queries_1.queryToGetAllGroups)(true), false, false);
        let groupsDone = 0;
        for (const group of allGroups) {
            let traversal = (0, queries_1.queryToGetGroupById)(group.groupId);
            console.log(`done: ${groupsDone}/${allGroups.length}`);
            groupsDone++;
            for (const propName of group_1.GROUP_PROPS_TO_ENCODE_AS_ARRAY) {
                if (group[propName] == null) {
                    continue;
                }
                traversal = traversal.property(database_manager_1.cardinality.single, propName, (0, encodeString_1.encodeString)((0, data_conversion_tools_1.serializeIfNeeded)(group[propName])));
            }
            await (0, database_manager_1.sendQuery)(() => traversal.iterate());
        }
        console.log("Finished with groups");
        /**
         * ENCODE TAGS DATA
         */
        const allTags = await (0, data_conversion_2.fromQueryToTagList)(database_manager_1.g.V().hasLabel("tag"));
        let tagsDone = 0;
        for (const tag of allTags) {
            let traversal = database_manager_1.g.V().hasLabel("tag").has("tagId", tag.tagId);
            console.log(`done: ${tagsDone}/${allTags.length}`);
            tagsDone++;
            for (const propName of tags_1.TAG_PROPS_TO_ENCODE_AS_ARRAY) {
                if (tag[propName] == null) {
                    continue;
                }
                traversal = traversal.property(database_manager_1.cardinality.single, propName, (0, encodeString_1.encodeString)((0, data_conversion_tools_1.serializeIfNeeded)(tag[propName])));
            }
            await (0, database_manager_1.sendQuery)(() => traversal.iterate());
        }
        console.log("Finished with tags");
        /**
         * NEW QUESTIONS MIGRATION
         */
        const allUsersWithTags = await (0, data_conversion_3.fromQueryToUserList)((0, queries_2.queryToGetAllUsers)({ includeDemoAccounts: true }), false, true);
        let usersDone = 0;
        for (const user of allUsersWithTags) {
            const questions = [];
            if (user.isCoupleProfile != null) {
                questions.push({ questionId: "q05", answerId: user.isCoupleProfile ? "q05-a02" : "q05-a01" });
            }
            if (user.isCoupleProfile === true) {
                questions.push({
                    questionId: "q06",
                    answerId: user.isUnicornHunter === true ? "q06-a01" : "q06-a02",
                });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q03-a02-v2") != null) {
                questions.push({ questionId: "taq-3-v2", answerId: "q03-a02-v2" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q03-a01-v2") != null) {
                questions.push({ questionId: "taq-3-v2", answerId: "q03-a01-v2" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q03-a00-v2") != null) {
                questions.push({ questionId: "taq-3-v2", answerId: "q03-a00-v2" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q04-a01") != null) {
                questions.push({ questionId: "taq-4", answerId: "q04-a01" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q04-a02") != null) {
                questions.push({ questionId: "taq-4", answerId: "q04-a02" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q00-a00") != null) {
                questions.push({ questionId: "taq-0", answerId: "q00-a00" });
            }
            if (user.tagsSubscribed.find(t => t.tagId === "q00-a01") != null) {
                questions.push({ questionId: "taq-0", answerId: "q00-a01" });
            }
            await (0, models_1.userPost)({ token: user.token, questionAnswers: questions, updateProfileCompletedProp: true }, replacements_1.fakeCtx);
            usersDone++;
            console.log(`done: ${usersDone}/${allUsersWithTags.length}`);
        }
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