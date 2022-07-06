"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const JestDateMock = require("jest-date-mock");
const models_1 = require("../components/tags/models");
const queries_1 = require("../components/user/queries");
const configurations_1 = require("../configurations");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
const general_1 = require("../common-tools/math-tools/general");
const models_2 = require("../components/user/models");
const js_tools_1 = require("../common-tools/js-tools/js-tools");
describe("Tags", () => {
    let user1;
    let user2;
    let userUnrelated;
    let user1Tags;
    let user2Tags;
    beforeAll(async () => {
        user1 = await (0, users_1.createFakeUser)({ language: "es" });
        user2 = await (0, users_1.createFakeUser)({ language: "es" });
        userUnrelated = await (0, users_1.createFakeUser)({ language: "en" });
    });
    test("Tags can be created up to the maximum allowed and correctly retrieved by language", async () => {
        for (let i = 0; i < configurations_1.TAGS_PER_TIME_FRAME; i++) {
            await (0, models_1.createTagPost)({
                token: userUnrelated.token,
                name: `unrelated user test tag ${i}`,
                category: "test category 1",
            }, replacements_1.fakeCtx);
            await (0, models_1.createTagPost)({
                token: user1.token,
                name: `user 1 test tag ${i}`,
                category: "test category 2",
            }, replacements_1.fakeCtx);
            await (0, models_1.createTagPost)({
                token: user2.token,
                name: `user 2 test tag ${i}`,
                category: "test category 3",
            }, replacements_1.fakeCtx);
        }
        user1Tags = await (0, models_1.tagsCreatedByUserGet)(user1.token);
        user2Tags = await (0, models_1.tagsCreatedByUserGet)(user2.token);
        const unrelatedTags = await (0, models_1.tagsCreatedByUserGet)(userUnrelated.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        expect(user2Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        expect(unrelatedTags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    test("Creating more tags than the maximum allowed per time frame should be not possible", async () => {
        await (0, models_1.createTagPost)({
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
        }, replacements_1.fakeCtxMuted);
        user1Tags = await (0, models_1.tagsCreatedByUserGet)(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    test("After full time frame passes it should be possible to add new tags", async () => {
        // Simulate time passing, not all required time
        JestDateMock.advanceBy((configurations_1.TAG_CREATION_TIME_FRAME * 1000) / 2);
        await (0, models_1.createTagPost)({
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
        }, replacements_1.fakeCtxMuted);
        user1Tags = await (0, models_1.tagsCreatedByUserGet)(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        // Now enough time has passed
        JestDateMock.advanceBy((configurations_1.TAG_CREATION_TIME_FRAME * 1000) / 2 + (0, general_1.hoursToMilliseconds)(1));
        await (0, models_1.createTagPost)({
            token: user1.token,
            name: `new test tag`,
            category: "test category 2",
        }, replacements_1.fakeCtx);
        user1Tags = await (0, models_1.tagsCreatedByUserGet)(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME + 1);
        JestDateMock.clear();
    });
    test("Should not be possible to create 2 tags with the same name in the same language", async () => {
        const user = await (0, users_1.createFakeUser)({ language: "es" });
        const userOutside = await (0, users_1.createFakeUser)({ language: "ru" });
        await (0, models_1.createTagPost)({
            token: user.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtxMuted);
        // Same tag than the previous one
        await (0, models_1.createTagPost)({
            token: user.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtxMuted);
        // This user is from another language so the tag should be created in this case
        await (0, models_1.createTagPost)({
            token: userOutside.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtx);
        const userTags = await (0, models_1.tagsCreatedByUserGet)(user.token);
        expect(userTags).toHaveLength(1);
        const userOutsideTags = await (0, models_1.tagsCreatedByUserGet)(userOutside.token);
        expect(userOutsideTags).toHaveLength(1);
    });
    test("Subscribing and retrieving subscribed tags works", async () => {
        var _a, _b;
        user1Tags = await (0, models_1.tagsGet)({ token: user1.token }, replacements_1.fakeCtx);
        const tagIds = [user1Tags[0].tagId, user1Tags[1].tagId];
        await (0, models_1.subscribeToTagsPost)({
            token: user1.token,
            tagIds,
        }, replacements_1.fakeCtx);
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        user2 = await (0, models_2.retrieveFullyRegisteredUser)(user2.token, true, replacements_1.fakeCtx);
        expect(user1.tagsSubscribed
            .map(t => t.tagId)
            .sort()
            .join()).toEqual(tagIds.sort().join());
        expect((_a = user1.tagsBlocked) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        expect((_b = user2.tagsSubscribed) !== null && _b !== void 0 ? _b : []).toHaveLength(0);
    });
    test("Removing subscription works", async () => {
        var _a;
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        const originalSubscriptions = [...user1.tagsSubscribed];
        await (0, models_1.removeSubscriptionToTagsPost)({
            token: user1.token,
            tagIds: [originalSubscriptions[0].tagId],
        });
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        expect((0, js_tools_1.objectsContentIsEqual)(user1.tagsSubscribed.map(t => t.tagId), [originalSubscriptions[1].tagId])).toBe(true);
        await (0, models_1.subscribeToTagsPost)({
            token: user1.token,
            tagIds: [originalSubscriptions[0].tagId],
        }, replacements_1.fakeCtx);
        await (0, models_1.subscribeToTagsPost)({
            token: user2.token,
            tagIds: [originalSubscriptions[0].tagId],
        }, replacements_1.fakeCtx);
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        await (0, models_1.removeSubscriptionToTagsPost)({
            token: user1.token,
            tagIds: user1.tagsSubscribed.map(t => t.tagId),
        });
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        user2 = await (0, models_2.retrieveFullyRegisteredUser)(user2.token, true, replacements_1.fakeCtx);
        expect((_a = user1.tagsSubscribed) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        expect(user2.tagsSubscribed).toHaveLength(1);
    });
    test("Adding and removing block works", async () => {
        var _a, _b;
        user1Tags = await (0, models_1.tagsGet)({ token: user1.token }, replacements_1.fakeCtx);
        const tagIds = [user1Tags[0].tagId];
        await (0, models_1.blockTagsPost)({
            token: user1.token,
            tagIds,
        });
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        user2 = await (0, models_2.retrieveFullyRegisteredUser)(user2.token, true, replacements_1.fakeCtx);
        expect((0, js_tools_1.objectsContentIsEqual)(tagIds, user1.tagsBlocked.map(t => t.tagId))).toBe(true);
        expect((_a = user2.tagsBlocked) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        await (0, models_1.removeBlockToTagsPost)({
            token: user1.token,
            tagIds,
        });
        user1 = await (0, models_2.retrieveFullyRegisteredUser)(user1.token, true, replacements_1.fakeCtx);
        expect((_b = user1.tagsBlocked) !== null && _b !== void 0 ? _b : []).toHaveLength(0);
    });
    test("Removing tag is possible when it has no interactions and not possible when has", async () => {
        user1Tags = await (0, models_1.tagsCreatedByUserGet)(user1.token);
        const tagIds = [user1Tags[0].tagId, user1Tags[1].tagId];
        await (0, models_1.subscribeToTagsPost)({
            token: user2.token,
            tagIds: [tagIds[0]],
        }, replacements_1.fakeCtx);
        await (0, models_1.blockTagsPost)({
            token: user2.token,
            tagIds: [tagIds[1]],
        });
        await (0, models_1.removeTagsPost)({ token: user1.token, tagIds: [tagIds[0]] }, replacements_1.fakeCtxMuted);
        expect(await (0, models_1.tagsCreatedByUserGet)(user1.token)).toHaveLength(user1Tags.length);
        await (0, models_1.removeSubscriptionToTagsPost)({
            token: user2.token,
            tagIds,
        });
        await (0, models_1.removeBlockToTagsPost)({
            token: user2.token,
            tagIds,
        });
        await (0, models_1.removeSubscriptionToTagsPost)({
            token: user1.token,
            tagIds,
        });
        await (0, models_1.removeBlockToTagsPost)({
            token: user1.token,
            tagIds,
        });
        await (0, models_1.removeTagsPost)({ token: user1.token, tagIds }, replacements_1.fakeCtx);
        expect(await (0, models_1.tagsCreatedByUserGet)(user1.token)).toHaveLength(user1Tags.length - tagIds.length);
    });
    test(`Subscribing to more tags than MAX_TAG_SUBSCRIPTIONS_ALLOWED is not possible for the same language`, async () => {
        let user = await (0, users_1.createFakeUser)({ language: "es" });
        const tags = [];
        const maxSubscriptionsAllowed = configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED + configurations_1.APP_AUTHORED_TAGS.length + configurations_1.QUESTIONS.length;
        // Create the maximum amount of tags for 'es' language
        for (let i = 0; i < maxSubscriptionsAllowed; i++) {
            const tempUser = await (0, users_1.createFakeUser)({ language: "es" });
            tags.push(await (0, models_1.createTagPost)({ token: tempUser.token, name: `max test tag ${i}`, category: `max test category ${i}` }, replacements_1.fakeCtx));
        }
        await (0, models_1.subscribeToTagsPost)({ token: user.token, tagIds: tags.map(t => t.tagId) }, replacements_1.fakeCtx);
        user = await (0, models_2.retrieveFullyRegisteredUser)(user.token, true, replacements_1.fakeCtx);
        expect(user.tagsSubscribed).toHaveLength(maxSubscriptionsAllowed);
        // Create one more tag and this one should not be possible to subscribe
        const tempUser2 = await (0, users_1.createFakeUser)({ language: "es" });
        const finalTag = await (0, models_1.createTagPost)({ token: tempUser2.token, name: `max test tag final`, category: `max test category final` }, replacements_1.fakeCtx);
        await (0, models_1.subscribeToTagsPost)({ token: user.token, tagIds: [finalTag.tagId] }, replacements_1.fakeCtxMuted);
        user = await (0, models_2.retrieveFullyRegisteredUser)(user.token, true, replacements_1.fakeCtx);
        expect(user.tagsSubscribed).toHaveLength(maxSubscriptionsAllowed);
    });
    test("Admin users can create unlimited tags", async () => {
        const adminUser = await (0, users_1.createFakeUser)(undefined, { makeItAdmin: true });
        for (let i = 0; i < configurations_1.TAGS_PER_TIME_FRAME + 2; i++) {
            await (0, models_1.createTagPost)({
                token: adminUser.token,
                name: `admin user test tag ${i}`,
                category: "test category 1",
            }, replacements_1.fakeCtx);
        }
        const tags = await (0, models_1.tagsCreatedByUserGet)(adminUser.token);
        expect(tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME + 2);
    });
    test("Unrelated user created at the beginning of the test was not affected", async () => {
        const tags = await (0, models_1.tagsCreatedByUserGet)(userUnrelated.token);
        expect(tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    afterAll(async () => {
        const testUsers = (0, users_1.getAllTestUsersCreated)();
        await (0, queries_1.queryToRemoveUsers)(testUsers);
        await (0, models_1.removeAllTagsCreatedBy)(testUsers);
    });
});
//# sourceMappingURL=tags.test.js.map