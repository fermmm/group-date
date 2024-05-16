"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const earl_1 = require("earl");
const beforeAllTests_1 = require("./tools/beforeAllTests");
const models_1 = require("../components/admin/models");
const models_2 = require("../components/user/models");
const queries_1 = require("../components/user/queries");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
const test = it;
describe("Admin", () => {
    let fakeUsers;
    let mainUser;
    let mainUser2;
    let adminUser;
    let adminUserNatural;
    before(async () => {
        await (0, beforeAllTests_1.initAppForTests)();
        fakeUsers = await (0, users_1.createFakeUsers)(4);
        mainUser = fakeUsers[0];
        mainUser2 = fakeUsers[1];
        adminUser = fakeUsers[2];
        adminUserNatural = fakeUsers[3];
        await (0, models_1.convertToAdmin)(adminUser.token);
    });
    test("Non admin users should not be able to convert other users into admins", async () => {
        await (0, models_1.convertToAdminPost)({ token: mainUser.token, targetUserToken: adminUserNatural.token }, replacements_1.fakeCtx);
        adminUserNatural = await (0, models_2.retrieveFullyRegisteredUser)(adminUserNatural.token, false, replacements_1.fakeCtx);
        (0, earl_1.expect)(adminUserNatural.isAdmin).toBeFalsy();
    });
    test("Admin users should be able to convert other users into admins", async () => {
        await (0, models_1.convertToAdminPost)({ token: adminUser.token, targetUserToken: adminUserNatural.token }, replacements_1.fakeCtx);
        adminUserNatural = await (0, models_2.retrieveFullyRegisteredUser)(adminUserNatural.token, false, replacements_1.fakeCtx);
        (0, earl_1.expect)(adminUserNatural.isAdmin).toEqual(true);
    });
    test("Sending messages to admins works", async () => {
        await (0, models_1.adminChatPost)({ token: mainUser.token, messageText: "hola que tal" }, replacements_1.fakeCtx);
        await (0, models_1.adminChatPost)({ token: mainUser.token, messageText: "una pregunta" }, replacements_1.fakeCtx);
        const chat = await (0, models_1.adminChatGet)({ token: mainUser.token }, replacements_1.fakeCtx);
        (0, earl_1.expect)(chat.messages.length).toEqual(2);
    });
    test("Admins can read messages", async () => {
        const chat = await (0, models_1.adminChatGet)({ token: adminUserNatural.token, targetUserId: mainUser.userId }, replacements_1.fakeCtx);
        (0, earl_1.expect)(chat.messages.length).toEqual(2);
        (0, earl_1.expect)(chat.nonAdminUser.userId).toEqual(mainUser.userId);
    });
    test("Admins can send messages and identity of admins is hidden", async () => {
        await (0, models_1.adminChatPost)({ token: mainUser2.token, messageText: "holis" }, null);
        await (0, models_1.adminChatPost)({ token: adminUser.token, targetUserId: mainUser2.userId, messageText: "hola que querés" }, null);
        const chat = await (0, models_1.adminChatGet)({ token: mainUser2.token }, null);
        (0, earl_1.expect)(chat.messages.length).toEqual(2);
        (0, earl_1.expect)(chat.messages[0].authorUserId).toEqual(mainUser2.userId);
        (0, earl_1.expect)(chat.messages[1].authorUserId).toBeFalsy();
    });
    test("Admins can get a list of all chats", async () => {
        const chats = await (0, models_1.allChatsWithAdminsGet)({ token: adminUser.token, excludeRespondedByAdmin: false }, null);
        (0, earl_1.expect)(chats.length).toEqual(2);
    });
    test("Admins can get a list of all chats filtered by responded by admins", async () => {
        const chats = await (0, models_1.allChatsWithAdminsGet)({ token: adminUser.token, excludeRespondedByAdmin: true }, null);
        (0, earl_1.expect)(chats.length).toEqual(1);
    });
    after(async () => {
        await (0, queries_1.queryToRemoveUsers)((0, users_1.getAllTestUsersCreated)());
    });
});
//# sourceMappingURL=admin.test.js.map