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
        user1 = await users_1.createFakeUser({ country: "ar" });
        user2 = await users_1.createFakeUser({ country: "ar" });
        userUnrelated = await users_1.createFakeUser({ country: "us" });
    });
    test("Tags can be created up to the maximum allowed and correctly retrieved by country", async () => {
        for (let i = 0; i < configurations_1.TAGS_PER_TIME_FRAME; i++) {
            await models_1.createTagPost({
                token: userUnrelated.token,
                name: `unrelated user test tag ${i}`,
                category: "test category 1",
            }, replacements_1.fakeCtx);
            await models_1.createTagPost({
                token: user1.token,
                name: `user 1 test tag ${i}`,
                category: "test category 2",
            }, replacements_1.fakeCtx);
            await models_1.createTagPost({
                token: user2.token,
                name: `user 2 test tag ${i}`,
                category: "test category 3",
            }, replacements_1.fakeCtx);
        }
        user1Tags = await models_1.tagsCreatedByUserGet(user1.token);
        user2Tags = await models_1.tagsCreatedByUserGet(user2.token);
        const unrelatedTags = await models_1.tagsCreatedByUserGet(userUnrelated.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        expect(user2Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        expect(unrelatedTags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    test("Creating more tags than the maximum allowed per time frame should be not possible", async () => {
        await models_1.createTagPost({
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
        }, replacements_1.fakeCtxMuted);
        user1Tags = await models_1.tagsCreatedByUserGet(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    test("After full time frame passes it should be possible to add new tags", async () => {
        // Simulate time passing, not all required time
        JestDateMock.advanceBy((configurations_1.TAG_CREATION_TIME_FRAME * 1000) / 2);
        await models_1.createTagPost({
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
        }, replacements_1.fakeCtxMuted);
        user1Tags = await models_1.tagsCreatedByUserGet(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
        // Now enough time has passed
        JestDateMock.advanceBy((configurations_1.TAG_CREATION_TIME_FRAME * 1000) / 2 + general_1.hoursToMilliseconds(1));
        await models_1.createTagPost({
            token: user1.token,
            name: `new test tag`,
            category: "test category 2",
        }, replacements_1.fakeCtx);
        user1Tags = await models_1.tagsCreatedByUserGet(user1.token);
        expect(user1Tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME + 1);
        JestDateMock.clear();
    });
    test("Should not be possible to create 2 tags with the same name in the same country", async () => {
        const user = await users_1.createFakeUser({ country: "ar" });
        const userOutside = await users_1.createFakeUser({ country: "ch" });
        await models_1.createTagPost({
            token: user.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtxMuted);
        // Same tag than the previous one
        await models_1.createTagPost({
            token: user.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtxMuted);
        // This user is from another country so the tag should be created in this case
        await models_1.createTagPost({
            token: userOutside.token,
            name: `duplicated test`,
            category: "test category",
        }, replacements_1.fakeCtx);
        const userTags = await models_1.tagsCreatedByUserGet(user.token);
        expect(userTags).toHaveLength(1);
        const userOutsideTags = await models_1.tagsCreatedByUserGet(userOutside.token);
        expect(userOutsideTags).toHaveLength(1);
    });
    test("Subscribing and retrieving subscribed tags works", async () => {
        var _a, _b;
        user1Tags = await models_1.tagsGet({ token: user1.token }, replacements_1.fakeCtx);
        const tagIds = [user1Tags[0].tagId, user1Tags[1].tagId];
        await models_1.subscribeToTagsPost({
            token: user1.token,
            tagIds,
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        user2 = await models_2.retrieveFullyRegisteredUser(user2.token, true, replacements_1.fakeCtx);
        expect(user1.tagsSubscribed
            .map(t => t.tagId)
            .sort()
            .join()).toEqual(tagIds.sort().join());
        expect((_a = user1.tagsBlocked) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        expect((_b = user2.tagsSubscribed) !== null && _b !== void 0 ? _b : []).toHaveLength(0);
    });
    test("Removing subscription works", async () => {
        var _a;
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        const originalSubscriptions = [...user1.tagsSubscribed];
        await models_1.removeSubscriptionToTagsPost({
            token: user1.token,
            tagIds: [originalSubscriptions[0].tagId],
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        expect(js_tools_1.objectsContentIsEqual(user1.tagsSubscribed.map(t => t.tagId), [originalSubscriptions[1].tagId])).toBe(true);
        await models_1.subscribeToTagsPost({
            token: user1.token,
            tagIds: [originalSubscriptions[0].tagId],
        });
        await models_1.subscribeToTagsPost({
            token: user2.token,
            tagIds: [originalSubscriptions[0].tagId],
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        await models_1.removeSubscriptionToTagsPost({
            token: user1.token,
            tagIds: user1.tagsSubscribed.map(t => t.tagId),
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        user2 = await models_2.retrieveFullyRegisteredUser(user2.token, true, replacements_1.fakeCtx);
        expect((_a = user1.tagsSubscribed) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        expect(user2.tagsSubscribed).toHaveLength(1);
    });
    test("Adding and removing block works", async () => {
        var _a, _b;
        user1Tags = await models_1.tagsGet({ token: user1.token }, replacements_1.fakeCtx);
        const tagIds = [user1Tags[0].tagId];
        await models_1.blockTagsPost({
            token: user1.token,
            tagIds,
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        user2 = await models_2.retrieveFullyRegisteredUser(user2.token, true, replacements_1.fakeCtx);
        expect(js_tools_1.objectsContentIsEqual(tagIds, user1.tagsBlocked.map(t => t.tagId))).toBe(true);
        expect((_a = user2.tagsBlocked) !== null && _a !== void 0 ? _a : []).toHaveLength(0);
        await models_1.removeBlockToTagsPost({
            token: user1.token,
            tagIds,
        });
        user1 = await models_2.retrieveFullyRegisteredUser(user1.token, true, replacements_1.fakeCtx);
        expect((_b = user1.tagsBlocked) !== null && _b !== void 0 ? _b : []).toHaveLength(0);
    });
    test("Removing tag is possible when it has no interactions and not possible when has", async () => {
        user1Tags = await models_1.tagsCreatedByUserGet(user1.token);
        const tagIds = [user1Tags[0].tagId, user1Tags[1].tagId];
        await models_1.subscribeToTagsPost({
            token: user2.token,
            tagIds: [tagIds[0]],
        });
        await models_1.blockTagsPost({
            token: user2.token,
            tagIds: [tagIds[1]],
        });
        await models_1.removeTagsPost({ token: user1.token, tagIds: [tagIds[0]] }, replacements_1.fakeCtxMuted);
        expect(await models_1.tagsCreatedByUserGet(user1.token)).toHaveLength(user1Tags.length);
        await models_1.removeSubscriptionToTagsPost({
            token: user2.token,
            tagIds,
        });
        await models_1.removeBlockToTagsPost({
            token: user2.token,
            tagIds,
        });
        await models_1.removeSubscriptionToTagsPost({
            token: user1.token,
            tagIds,
        });
        await models_1.removeBlockToTagsPost({
            token: user1.token,
            tagIds,
        });
        await models_1.removeTagsPost({ token: user1.token, tagIds }, replacements_1.fakeCtx);
        expect(await models_1.tagsCreatedByUserGet(user1.token)).toHaveLength(user1Tags.length - tagIds.length);
    });
    test(`Subscribing to more tags than MAX_TAG_SUBSCRIPTIONS_ALLOWED is not possible for the same country`, async () => {
        let user = await users_1.createFakeUser({ country: "ar" });
        const tags = [];
        // Create the maximum amount of tags for 'ar' country
        for (let i = 0; i < configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED; i++) {
            const tempUser = await users_1.createFakeUser({ country: "ar" });
            tags.push(await models_1.createTagPost({ token: tempUser.token, name: `max test tag ${i}`, category: `max test category ${i}` }, replacements_1.fakeCtx));
        }
        await models_1.subscribeToTagsPost({ token: user.token, tagIds: tags.map(t => t.tagId) });
        user = await models_2.retrieveFullyRegisteredUser(user.token, true, replacements_1.fakeCtx);
        expect(user.tagsSubscribed).toHaveLength(configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED);
        // Create one more tag and this one should not be possible to subscribe
        const tempUser2 = await users_1.createFakeUser({ country: "ar" });
        const finalTag = await models_1.createTagPost({ token: tempUser2.token, name: `max test tag final`, category: `max test category final` }, replacements_1.fakeCtx);
        await models_1.subscribeToTagsPost({ token: user.token, tagIds: [finalTag.tagId] });
        user = await models_2.retrieveFullyRegisteredUser(user.token, true, replacements_1.fakeCtx);
        expect(user.tagsSubscribed).toHaveLength(configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED);
        // Create one more tag but this one in a different country and should be possible to subscribe
        const tempUser3 = await users_1.createFakeUser({ country: "ru" });
        const otherCountryTag = await models_1.createTagPost({ token: tempUser3.token, name: `max test tag final`, category: `max test category final` }, replacements_1.fakeCtx);
        await models_1.subscribeToTagsPost({ token: user.token, tagIds: [otherCountryTag.tagId] });
        user = await models_2.retrieveFullyRegisteredUser(user.token, true, replacements_1.fakeCtx);
        expect(user.tagsSubscribed).toHaveLength(configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED + 1);
    });
    test("Admin users can create unlimited tags", async () => {
        const adminUser = await users_1.createFakeUser(undefined, { makeItAdmin: true });
        for (let i = 0; i < configurations_1.TAGS_PER_TIME_FRAME + 2; i++) {
            await models_1.createTagPost({
                token: adminUser.token,
                name: `admin user test tag ${i}`,
                category: "test category 1",
            }, replacements_1.fakeCtx);
        }
        const tags = await models_1.tagsCreatedByUserGet(adminUser.token);
        expect(tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME + 2);
    });
    test("Unrelated user created at the beginning of the test was not affected", async () => {
        const tags = await models_1.tagsCreatedByUserGet(userUnrelated.token);
        expect(tags).toHaveLength(configurations_1.TAGS_PER_TIME_FRAME);
    });
    afterAll(async () => {
        const testUsers = users_1.getAllTestUsersCreated();
        await queries_1.queryToRemoveUsers(testUsers);
        await models_1.removeAllTagsCreatedBy(testUsers);
    });
});
//# sourceMappingURL=tags.test.js.map