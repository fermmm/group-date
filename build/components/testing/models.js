"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFakeChatConversation = exports.forceGroupSearch = exports.createFakeTagsPost = exports.createFakeUsersPost = void 0;
const moment = require("moment");
const general_1 = require("./../../common-tools/math-tools/general");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const generalTools_1 = require("../../tests/tools/generalTools");
const users_1 = require("../../tests/tools/users");
const models_1 = require("../groups-finder/models");
const models_2 = require("../tags/models");
const models_3 = require("../user/models");
const configurations_1 = require("../../configurations");
const models_4 = require("../groups/models");
const data_conversion_1 = require("../user/tools/data-conversion");
const queries_1 = require("../user/queries");
const allUsersCreated = [];
async function createFakeUsersPost(params, ctx) {
    const user = await (0, models_3.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin) {
        return `Error: Only admins can use this`;
    }
    const usersCreated = await (0, users_1.createFakeCompatibleUsers)(await (0, models_3.retrieveFullyRegisteredUser)(params.token, false, ctx), Number(params.text));
    allUsersCreated.push(...usersCreated);
    for (let i = 0; i < usersCreated.length; i++) {
        const userCreated = usersCreated[i];
        if (i % 2 == 0) {
            await (0, models_2.subscribeToTagsPost)({ token: userCreated.token, tagIds: [configurations_1.APP_AUTHORED_TAGS[0].tagId] }, ctx);
        }
        else {
            await (0, models_2.subscribeToTagsPost)({ token: userCreated.token, tagIds: [configurations_1.APP_AUTHORED_TAGS[1].tagId] }, ctx);
        }
    }
    for (const userCreated of allUsersCreated) {
        await (0, models_3.setAttractionPost)({
            token: userCreated.token,
            attractions: [
                ...allUsersCreated.map(otherUser => ({
                    userId: otherUser.userId,
                    attractionType: user_1.AttractionType.Like,
                })),
                { userId: user.userId, attractionType: user_1.AttractionType.Like },
            ],
        }, ctx);
    }
    return "Users created";
}
exports.createFakeUsersPost = createFakeUsersPost;
async function createFakeTagsPost(params, ctx) {
    const user = await (0, models_3.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin) {
        return `Error: Only admins can use this`;
    }
    const tagsCreated = [];
    for (let i = 0; i < Number(params.text); i++) {
        const tagParams = {
            token: user.token,
            name: generalTools_1.chance.sentence({ words: (0, general_1.getRandomInt)(1, 3) }),
            category: generalTools_1.chance.sentence({ words: 1 }),
            creationDate: moment().subtract(i, "days").unix(),
            lastInteractionDate: moment().subtract((0, general_1.getRandomInt)(0, i), "days").unix(),
            fakeSubscribersAmount: Math.random() < 0.5 ? i * 2 : (0, general_1.getRandomInt)(0, 5),
            fakeBlockersAmount: Math.random() < 0.5 ? Math.floor(i * 0.2) : 0,
        };
        tagsCreated.push(await (0, models_2.createTagPost)(tagParams, ctx));
    }
    return `${tagsCreated.length} tags created!`;
}
exports.createFakeTagsPost = createFakeTagsPost;
async function forceGroupSearch(params, ctx) {
    const user = await (0, models_3.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin) {
        return `Error: Only admins can use this`;
    }
    const groupsCreated = await (0, models_1.searchAndCreateNewGroups)();
    return `Created ${groupsCreated.length} groups.`;
}
exports.forceGroupSearch = forceGroupSearch;
async function createFakeChatConversation(params, ctx) {
    const user = await (0, models_3.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin) {
        return `Error: Only admins can use this`;
    }
    const fakeConversation = [
        "holaaa son muy bellos todos",
        "lo mismo digo",
        "esta lindo el dia, vamos a la playa?",
        "sii, yo puedo =)",
        "yo tambien puedo!!!",
        "yendo",
        "yo me libero en 10",
        "si vamos",
        "yo no! pero la proxima me sumo! =)",
        "eh... me parece una muy buena idea",
    ];
    const groups = await (0, models_4.userGroupsGet)({ token: params.token }, ctx, true);
    let currentConversationMessage = 0;
    for (const group of groups) {
        for (const member of group.members) {
            const message = fakeConversation[currentConversationMessage];
            const chatUser = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserById)(member.userId), true);
            await (0, models_4.chatPost)({ token: chatUser.token, groupId: group.groupId, message }, ctx);
            currentConversationMessage++;
            if (currentConversationMessage >= fakeConversation.length) {
                currentConversationMessage = 0;
            }
        }
    }
    return `Created fake conversation.`;
}
exports.createFakeChatConversation = createFakeChatConversation;
//# sourceMappingURL=models.js.map