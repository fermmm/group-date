"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const models_1 = require("../components/groups/models");
const queries_1 = require("../components/groups/queries");
const models_2 = require("../components/user/models");
const queries_2 = require("../components/user/queries");
const user_1 = require("../shared-tools/endpoints-interfaces/user");
const groups_1 = require("./tools/groups");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
describe("Users", () => {
    let matchingUsersCouple1;
    let matchingUsersCouple2;
    let matchingUsersCouple3;
    let matching10;
    let matching10Group;
    let testProtagonist;
    beforeAll(async () => {
        matchingUsersCouple1 = await groups_1.createMatchingUsers(2);
        matchingUsersCouple2 = await groups_1.createMatchingUsers(2);
        matchingUsersCouple3 = await groups_1.createMatchingUsers(2);
        matching10 = await groups_1.createMatchingUsers(10);
        testProtagonist = await users_1.createFakeUser();
    });
    test("A user profile can be completed", async () => {
        await models_2.profileStatusGet({ token: matchingUsersCouple1[0].token }, replacements_1.fakeCtx);
        const updatedUser = await models_2.userGet({ token: matchingUsersCouple1[0].token }, replacements_1.fakeCtx);
        expect(updatedUser.profileCompleted).toBe(true);
    });
    test("Notifications works", async () => {
        await models_2.addNotificationToUser({ token: matchingUsersCouple1[0].token }, {
            type: user_1.NotificationType.Group,
            title: "Prueba",
            text: "sarasa2",
            targetId: "http://sarasa.com",
        });
        await models_2.addNotificationToUser({ token: matchingUsersCouple1[0].token }, {
            type: user_1.NotificationType.NearbyPartyOrEvent,
            title: "sarasa3",
            text: "sarasa4",
            targetId: "http://sarasa.com",
        });
        const updatedUser = await models_2.userGet({ token: matchingUsersCouple1[0].token }, replacements_1.fakeCtx);
        // There is a notification created when the user is created but it does not get created in the tests
        expect(updatedUser.notifications.length).toBe(2);
    });
    test("Attraction works", async () => {
        // Self liking should be not possible
        await users_1.setAttraction(testProtagonist, [testProtagonist], user_1.AttractionType.Like);
        expect(await models_2.attractionsSentGet(testProtagonist.token, [user_1.AttractionType.Like])).toHaveLength(0);
        expect(await models_2.attractionsReceivedGet(testProtagonist.token, [user_1.AttractionType.Like])).toHaveLength(0);
        // Multiple likes sent simultaneously gets saved
        await users_1.setAttraction(testProtagonist, matchingUsersCouple2, user_1.AttractionType.Like);
        await users_1.setAttraction(testProtagonist, matchingUsersCouple3, user_1.AttractionType.Dislike);
        expect(await models_2.attractionsSentGet(testProtagonist.token, [user_1.AttractionType.Like])).toHaveLength(matchingUsersCouple2.length);
        expect(await models_2.attractionsSentGet(testProtagonist.token, [user_1.AttractionType.Dislike])).toHaveLength(matchingUsersCouple3.length);
        expect(await models_2.attractionsReceivedGet(matchingUsersCouple2[0].token, [user_1.AttractionType.Like])).toHaveLength(1);
        expect((await models_2.attractionsReceivedGet(matchingUsersCouple2[0].token, [user_1.AttractionType.Like]))[0].userId).toBe(testProtagonist.userId);
        // Matches can be added and removed without losing information
        await users_1.setAttraction(matchingUsersCouple2[0], [testProtagonist], user_1.AttractionType.Like);
        await users_1.setAttraction(matchingUsersCouple2[1], [testProtagonist], user_1.AttractionType.Like);
        expect(await models_2.attractionsReceivedGet(matchingUsersCouple2[0].token, [user_1.AttractionType.Like])).toHaveLength(0);
        expect(await models_2.matchesGet(matchingUsersCouple2[0].token)).toHaveLength(2);
        await users_1.setAttraction(matchingUsersCouple2[0], [testProtagonist], user_1.AttractionType.Dislike);
        expect(await models_2.matchesGet(matchingUsersCouple2[0].token)).toHaveLength(1);
        expect((await models_2.attractionsReceivedGet(testProtagonist.token, [user_1.AttractionType.Dislike]))[0].userId).toBe(matchingUsersCouple2[0].userId);
        await users_1.setAttraction(matchingUsersCouple2[0], [testProtagonist], user_1.AttractionType.Like);
        expect(await models_2.matchesGet(matchingUsersCouple2[0].token)).toHaveLength(2);
        expect(await models_2.attractionsReceivedGet(testProtagonist.token, [user_1.AttractionType.Dislike])).toHaveLength(0);
        // Other users don't get affected by the previous lines
        expect(await models_2.matchesGet(matchingUsersCouple1[0].token)).toHaveLength(1);
        expect(await models_2.matchesGet(matchingUsersCouple1[1].token)).toHaveLength(1);
        expect((await models_2.matchesGet(matchingUsersCouple1[0].token))[0].userId).toBe(matchingUsersCouple1[1].userId);
        expect((await models_2.matchesGet(matchingUsersCouple1[1].token))[0].userId).toBe(matchingUsersCouple1[0].userId);
        expect(await models_2.matchesGet(matching10[matching10.length - 1].token)).toHaveLength(matching10.length - 1);
        // After a group creation the users "Match" are converted into a "SeenMatch" and it should not be possible to change set attraction anymore
        matching10Group = await models_1.createGroup({
            usersIds: matching10.map(u => u.userId),
            slotToUse: models_1.getSlotIdFromUsersAmount(matching10.length),
        });
        await users_1.setAttraction(matching10[0], [matching10[1]], user_1.AttractionType.Dislike);
        expect(await models_2.attractionsSentGet(matching10[0].token, [user_1.AttractionType.Dislike])).toHaveLength(0);
    });
    afterAll(async () => {
        await queries_2.queryToRemoveUsers(users_1.getAllTestUsersCreated());
        await queries_1.queryToRemoveGroups([matching10Group]);
    });
});
//# sourceMappingURL=users.test.js.map