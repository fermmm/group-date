"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_tools_1 = require("./../common-tools/math-tools/date-tools");
require("jest");
const models_1 = require("../components/cards-game/models");
const models_2 = require("../components/user/models");
const queries_1 = require("../components/user/queries");
const user_1 = require("../shared-tools/endpoints-interfaces/user");
const replacements_1 = require("./tools/replacements");
const reusable_tests_1 = require("./tools/reusable-tests");
const users_1 = require("./tools/users");
const models_3 = require("../components/tags/models");
const configurations_1 = require("../configurations");
describe("Cards game", () => {
    let usersDataCompatible;
    let usersDataIncompatible;
    let allUsersData;
    let fakeUsers = [];
    let searcherUser;
    let recommendations;
    const searcherParams = {
        ...(0, users_1.generateRandomUserProps)(),
        name: "searcher user",
        profileDescription: "",
        birthDate: (0, date_tools_1.fromAgeToBirthDate)(32),
        height: 265,
        locationLat: -34.608404,
        locationLon: -58.387697,
        targetAgeMin: 20,
        targetAgeMax: 38,
        targetDistance: 60,
        images: ["http://test.com/image.jpg"],
        dateIdea: "holis.",
        genders: [user_1.Gender.Woman],
        likesGenders: [user_1.Gender.Man],
    };
    const compatibleParams = {
        name: "compatibleParams",
        birthDate: (0, date_tools_1.fromAgeToBirthDate)(30),
        targetAgeMin: 20,
        targetAgeMax: 40,
        targetDistance: 60,
        locationLat: -34.597917,
        locationLon: -58.412001,
        genders: [user_1.Gender.Woman, user_1.Gender.Man, user_1.Gender.Bigender],
        likesGenders: [user_1.Gender.Woman, user_1.Gender.Man, user_1.Gender.Androgynous],
    };
    const compatible = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "compatible 1",
    };
    const compatible2 = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "compatible 2",
        locationLat: -34.608204,
        locationLon: -58.502031,
        genders: [user_1.Gender.Man],
        likesGenders: [user_1.Gender.Woman],
    };
    // This is incompatible because the distance is too far for the user
    const incompatibleTooFar = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "distance incompatible",
        locationLat: -34.652713,
        locationLon: -59.425083,
    };
    // This is incompatible because his target distance is to low
    const incompatibleWantsCloser = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "distance incompatible",
        targetDistance: 25,
        locationLat: -34.628378,
        locationLon: -58.734897,
    };
    const incompatibleTooOld = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "age incompatible",
        birthDate: (0, date_tools_1.fromAgeToBirthDate)(40),
    };
    const incompatibleTooYoung = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "age incompatible 2",
        birthDate: (0, date_tools_1.fromAgeToBirthDate)(18),
    };
    const incompatibleSearcherUserTooOld = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "age incompatible 3",
        targetAgeMin: 18,
        targetAgeMax: 25,
    };
    const incompatibleSearcherUserTooYoung = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        name: "age incompatible 3",
        targetAgeMin: 35,
        targetAgeMax: 48,
    };
    const incompatibleTransGender = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        genders: [user_1.Gender.Man, user_1.Gender.TransgenderWoman],
        name: "incompatible trans gender",
    };
    const incompatibleCisGender = {
        ...(0, users_1.generateRandomUserProps)(),
        ...compatibleParams,
        genders: [user_1.Gender.Woman, user_1.Gender.Androgynous],
        name: "incompatible cis gender",
    };
    // Add here the users that should be compatible and appear on the recommendations
    usersDataCompatible = [compatible, compatible2];
    // Add here the users that should not be appearing on the recommendations
    usersDataIncompatible = [
        incompatibleTooFar,
        incompatibleWantsCloser,
        incompatibleTooOld,
        incompatibleTooYoung,
        incompatibleSearcherUserTooOld,
        incompatibleSearcherUserTooYoung,
        incompatibleTransGender,
        incompatibleCisGender,
    ];
    allUsersData = [...usersDataCompatible, ...usersDataIncompatible];
    beforeAll(async () => {
        searcherUser = await (0, users_1.createFakeUser)(searcherParams);
        fakeUsers = await (0, users_1.createMultipleFakeCustomUsers)(allUsersData);
        recommendations = await (0, models_1.recommendationsGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
    });
    test("Only the compatible users appear on the recommendations", async () => {
        expect(recommendations).toHaveLength(usersDataCompatible.length);
    });
    test("Incompatible recommendations tests were done correctly", () => {
        (0, reusable_tests_1.createdUsersMatchesFakeData)(fakeUsers, allUsersData, true);
    });
    test("Blocked users are not recommended", async () => {
        recommendations = await (0, models_1.recommendationsGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
        // Check amount
        const originalAmount = recommendations.length;
        const targetUserId = recommendations[0].userId;
        await (0, models_2.blockUserPost)({ token: searcherUser.token, targetUserId }, replacements_1.fakeCtx);
        recommendations = await (0, models_1.recommendationsGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
        expect(recommendations).toHaveLength(originalAmount - 1);
        await (0, models_2.unblockUserPost)({ token: searcherUser.token, targetUserId }, replacements_1.fakeCtx);
        recommendations = await (0, models_1.recommendationsGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
        expect(recommendations).toHaveLength(originalAmount);
    });
    test("Recommendations returns correct users in correct order", async () => {
        // Check amount
        expect(recommendations).toHaveLength(2);
        // Check for duplication
        expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);
        // Send profile evaluation to search results and try again to make sure evaluated users are not returned
        await (0, users_1.setAttraction)(searcherUser, recommendations, user_1.AttractionType.Dislike);
        recommendations = await (0, models_1.recommendationsGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
        expect(recommendations).toHaveLength(0);
    });
    test("Disliked users returns the correct data", async () => {
        recommendations = await (0, models_1.dislikedUsersGet)({ token: searcherUser.token }, replacements_1.fakeCtx);
        // Check amount
        expect(recommendations).toHaveLength(usersDataCompatible.length);
        // Check for duplication
        expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);
        await (0, queries_1.queryToRemoveUsers)(fakeUsers);
    });
    test("Users gets notified of new cards when they request for it", async () => {
        await (0, queries_1.queryToRemoveUsers)(fakeUsers);
        let mainUser = await (0, users_1.createFakeUser)();
        const fakeCompatibleUsers = await (0, users_1.createFakeCompatibleUsers)(mainUser, 10);
        // The test is going to be done correctly
        mainUser = (await (0, models_2.userGet)({ token: mainUser.token }, replacements_1.fakeCtx));
        // The welcome notification is not working on tests so we should have 0 notifications
        expect(mainUser.notifications.length).toBe(0);
        // If the user does not request for notifications should be not notified
        await (0, models_1.notifyUsersAboutNewCards)({ userIds: [mainUser.userId] });
        mainUser = (await (0, models_2.userGet)({ token: mainUser.token }, replacements_1.fakeCtx));
        expect(mainUser.notifications.length).toBe(0);
        // Here user requests for notifications
        await (0, models_2.userPost)({ token: mainUser.token, props: { sendNewUsersNotification: 10 } }, replacements_1.fakeCtx);
        // Now it should be notified
        await (0, models_1.notifyUsersAboutNewCards)({ userIds: [mainUser.userId] });
        mainUser = (await (0, models_2.userGet)({ token: mainUser.token }, replacements_1.fakeCtx));
        expect(mainUser.notifications.length).toBe(1);
        // Repetition should not add more notifications
        await (0, models_1.notifyUsersAboutNewCards)({ userIds: [mainUser.userId] });
        mainUser = (await (0, models_2.userGet)({ token: mainUser.token }, replacements_1.fakeCtx));
        expect(mainUser.notifications.length).toBe(1);
        await (0, queries_1.queryToRemoveUsers)([mainUser]);
        await (0, queries_1.queryToRemoveUsers)(fakeCompatibleUsers);
    });
    test("Users with matching tags appear first", async () => {
        // Only admins can create unlimited tags
        const adminUser = await (0, users_1.createFakeUser)(undefined, { makeItAdmin: true });
        const searcher = (await (0, users_1.createFakeCompatibleUsers)(adminUser, 1))[0];
        // Create 5 tags (only admins can create unlimited tags)
        for (let i = 0; i < 5; i++) {
            await (0, models_3.createTagPost)({
                token: adminUser.token,
                name: `cards test tag ${i}`,
                category: "test category 1",
            }, replacements_1.fakeCtx);
        }
        // Store the tags
        const tags = await (0, models_3.tagsCreatedByUserGet)(adminUser.token);
        const tagIds = tags.map(t => t.tagId);
        // Create 5 users compatible but not with tags, so we can test these users will appear last
        await (0, users_1.createFakeCompatibleUsers)(searcher, 5);
        // Create 3 users that will be compatible in tags, so we can test that these users appear first
        const tagCompatibleUsers = await (0, users_1.createFakeCompatibleUsers)(searcher, 3);
        // Create a user that blocks the searcher, so we can test that this user also does not appear
        const userShouldNotAppear1 = (await (0, users_1.createFakeCompatibleUsers)(searcher, 1))[0];
        const userShouldNotAppear2 = (await (0, users_1.createFakeCompatibleUsers)(searcher, 1))[0];
        // Searcher user subscribes to 2 tags and blocks 1 tag
        await (0, models_3.subscribeToTagsPost)({ token: searcher.token, tagIds: [tagIds[0], tagIds[1]] }, replacements_1.fakeCtx);
        await (0, models_3.blockTagsPost)({ token: searcher.token, tagIds: [tagIds[2]] });
        // The user that should appear first does the same than the searcher
        await (0, models_3.subscribeToTagsPost)({
            token: tagCompatibleUsers[0].token,
            tagIds: [tagIds[0], tagIds[1]],
        }, replacements_1.fakeCtx);
        await (0, models_3.blockTagsPost)({ token: tagCompatibleUsers[0].token, tagIds: [tagIds[2]] });
        // This one should appear second because it's subscribed to all tags but does not block any of them
        await (0, models_3.subscribeToTagsPost)({
            token: tagCompatibleUsers[1].token,
            tagIds: [tagIds[0], tagIds[1], tagIds[3], tagIds[4]],
        }, replacements_1.fakeCtx);
        // Single coincidence
        await (0, models_3.blockTagsPost)({
            token: tagCompatibleUsers[2].token,
            tagIds: [tagIds[2]],
        });
        // User subscribed to tag that the searcher blocks
        await (0, models_3.subscribeToTagsPost)({
            token: userShouldNotAppear1.token,
            tagIds: [tagIds[2]],
        }, replacements_1.fakeCtx);
        // User blocks tag that the searcher subscribes
        await (0, models_3.blockTagsPost)({
            token: userShouldNotAppear2.token,
            tagIds: [tagIds[0]],
        });
        recommendations = await (0, models_1.recommendationsGet)({ token: searcher.token }, replacements_1.fakeCtx);
        expect(recommendations).toHaveLength(9);
        expect(recommendations[0].userId).toBe(tagCompatibleUsers[0].userId);
        expect(recommendations[1].userId).toBe(tagCompatibleUsers[1].userId);
        expect(recommendations[2].userId).toBe(tagCompatibleUsers[2].userId);
    });
    test("Liking users appears in the first places of the results", async () => {
        const searcher = await (0, users_1.createFakeUser)();
        const nonLikingUsers = await (0, users_1.createFakeCompatibleUsers)(searcher, configurations_1.NON_SEARCHER_LIKING_CHUNK * 3);
        const likingUsers = await (0, users_1.createFakeCompatibleUsers)(searcher, configurations_1.SEARCHER_LIKING_CHUNK);
        for (const usr of likingUsers) {
            await (0, models_2.setAttractionPost)({
                token: usr.token,
                attractions: [{ userId: searcher.userId, attractionType: user_1.AttractionType.Like }],
            }, replacements_1.fakeCtx);
        }
        const tag = await (0, models_3.createTagPost)({
            token: searcher.token,
            name: `searcher tag`,
            category: "test category 1",
        }, replacements_1.fakeCtx);
        await (0, models_3.subscribeToTagsPost)({ token: searcher.token, tagIds: [tag.tagId] }, replacements_1.fakeCtx);
        /*
         * We subscribe the nonLiking users to the same tag to make them appear first, but this should
         * not happen because liking users have their special place.
         */
        for (const usr of nonLikingUsers) {
            await (0, models_3.subscribeToTagsPost)({ token: usr.token, tagIds: [tag.tagId] }, replacements_1.fakeCtx);
        }
        recommendations = await (0, models_1.recommendationsGet)({ token: searcher.token }, replacements_1.fakeCtx);
        expect(recommendations.findIndex(u => likingUsers[0].userId === u.userId)).toBeLessThanOrEqual(configurations_1.SEARCHER_LIKING_CHUNK + configurations_1.NON_SEARCHER_LIKING_CHUNK);
    });
    afterAll(async () => {
        const testUsers = (0, users_1.getAllTestUsersCreated)();
        await (0, queries_1.queryToRemoveUsers)(testUsers);
        await (0, models_3.removeAllTagsCreatedBy)(testUsers);
    });
});
//# sourceMappingURL=cards-game.test.js.map