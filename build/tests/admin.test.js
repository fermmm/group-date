"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const models_1 = require("../components/admin/models");
const models_2 = require("../components/user/models");
const queries_1 = require("../components/user/queries");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
describe("Admin", () => {
    let fakeUsers;
    let mainUser;
    let mainUser2;
    let adminUser;
    let adminUserNatural;
    beforeAll(async () => {
        fakeUsers = await users_1.createFakeUsers(4);
        mainUser = fakeUsers[0];
        mainUser2 = fakeUsers[1];
        adminUser = fakeUsers[2];
        adminUserNatural = fakeUsers[3];
        await models_1.convertToAdmin(adminUser.token);
    });
    test("Non admin users should not be able to convert other users into admins", async () => {
        await models_1.convertToAdminPost({ token: mainUser.token, targetUserToken: adminUserNatural.token }, replacements_1.fakeCtx);
        adminUserNatural = await models_2.retrieveFullyRegisteredUser(adminUserNatural.token, false, replacements_1.fakeCtx);
        expect(adminUserNatural.isAdmin).toBeFalsy();
    });
    test("Admin users should be able to convert other users into admins", async () => {
        await models_1.convertToAdminPost({ token: adminUser.token, targetUserToken: adminUserNatural.token }, replacements_1.fakeCtx);
        adminUserNatural = await models_2.retrieveFullyRegisteredUser(adminUserNatural.token, false, replacements_1.fakeCtx);
        expect(adminUserNatural.isAdmin).toBe(true);
    });
    test("Sending messages to admins works", async () => {
        await models_1.adminChatPost({ token: mainUser.token, messageText: "hola que tal" }, replacements_1.fakeCtx);
        await models_1.adminChatPost({ token: mainUser.token, messageText: "una pregunta" }, replacements_1.fakeCtx);
        const chat = await models_1.adminChatGet({ token: mainUser.token }, replacements_1.fakeCtx);
        expect(chat.messages.length).toBe(2);
    });
    test("Admins can read messages", async () => {
        const chat = await models_1.adminChatGet({ token: adminUserNatural.token, targetUserId: mainUser.userId }, replacements_1.fakeCtx);
        expect(chat.messages.length).toBe(2);
        expect(chat.nonAdminUser.userId).toBe(mainUser.userId);
    });
    test("Admins can send messages and identity of admins is hidden", async () => {
        await models_1.adminChatPost({ token: mainUser2.token, messageText: "holis" }, null);
        await models_1.adminChatPost({ token: adminUser.token, targetUserId: mainUser2.userId, messageText: "hola que querés" }, null);
        const chat = await models_1.adminChatGet({ token: mainUser2.token }, null);
        expect(chat.messages.length).toBe(2);
        expect(chat.messages[0].authorUserId).toBe(mainUser2.userId);
        expect(chat.messages[1].authorUserId).toBeFalsy();
    });
    test("Admins can get a list of all chats", async () => {
        const chats = await models_1.allChatsWithAdminsGet({ token: adminUser.token, excludeRespondedByAdmin: false }, null);
        expect(chats.length).toBe(2);
    });
    test("Admins can get a list of all chats filtered by responded by admins", async () => {
        const chats = await models_1.allChatsWithAdminsGet({ token: adminUser.token, excludeRespondedByAdmin: true }, null);
        expect(chats.length).toBe(1);
    });
    afterAll(async () => {
        await queries_1.queryToRemoveUsers(users_1.getAllTestUsersCreated());
    });
});
//# sourceMappingURL=admin.test.js.map