import "jest";
import * as JestDateMock from "jest-date-mock";
import {
   blockTagPost,
   createTagPost,
   removeAllTagsCreatedBy,
   removeBlockToTagPost,
   removeSubscriptionToTagPost,
   removeTagsPost,
   subscribeToTagPost,
   tagsCreatedByUserGet,
   tagsGet,
} from "../components/tags/models";
import { queryToRemoveUsers } from "../components/user/queries";
import { MAX_TAG_SUBSCRIPTIONS_ALLOWED, TAGS_PER_TIME_FRAME, TAG_CREATION_TIME_FRAME } from "../configurations";
import { User } from "../shared-tools/endpoints-interfaces/user";
import { fakeCtx, fakeCtxMuted } from "./tools/replacements";
import { createFakeUser, getAllTestUsersCreated } from "./tools/users";
import { hoursToMilliseconds } from "../common-tools/math-tools/general";
import { Tag } from "../shared-tools/endpoints-interfaces/tags";
import { retrieveFullyRegisteredUser } from "../components/user/models";
import { objectsContentIsEqual } from "../common-tools/js-tools/js-tools";
import { createFakeUser2 } from "./tools/_experimental";

describe("Tags", () => {
   let user1: User;
   let user2: User;
   let userUnrelated: User;
   let user1Tags: Tag[];
   let user2Tags: Tag[];

   beforeAll(async () => {
      user1 = await createFakeUser({ country: "ar" });
      user2 = await createFakeUser({ country: "ar" });
      userUnrelated = await createFakeUser({ country: "us" });
   });

   test("Tags can be created up to the maximum allowed and correctly retrieved by country", async () => {
      for (let i = 0; i < TAGS_PER_TIME_FRAME; i++) {
         await createTagPost(
            {
               token: userUnrelated.token,
               name: `unrelated user test tag ${i}`,
               category: "test category 1",
            },
            fakeCtx,
         );

         await createTagPost(
            {
               token: user1.token,
               name: `user 1 test tag ${i}`,
               category: "test category 2",
            },
            fakeCtx,
         );

         await createTagPost(
            {
               token: user2.token,
               name: `user 2 test tag ${i}`,
               category: "test category 3",
            },
            fakeCtx,
         );
      }

      user1Tags = await tagsCreatedByUserGet(user1.token);
      user2Tags = await tagsCreatedByUserGet(user2.token);
      const unrelatedTags = await tagsCreatedByUserGet(userUnrelated.token);

      expect(user1Tags).toHaveLength(TAGS_PER_TIME_FRAME);
      expect(user2Tags).toHaveLength(TAGS_PER_TIME_FRAME);
      expect(unrelatedTags).toHaveLength(TAGS_PER_TIME_FRAME);
   });
   test("Creating more tags than the maximum allowed per time frame should be not possible", async () => {
      await createTagPost(
         {
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
         },
         fakeCtxMuted,
      );

      user1Tags = await tagsCreatedByUserGet(user1.token);
      expect(user1Tags).toHaveLength(TAGS_PER_TIME_FRAME);
   });

   test("After full time frame passes it should be possible to add new tags", async () => {
      // Simulate time passing, not all required time
      JestDateMock.advanceBy((TAG_CREATION_TIME_FRAME * 1000) / 2);

      await createTagPost(
         {
            token: user1.token,
            name: `test tag should not be created`,
            category: "test category 2",
         },
         fakeCtxMuted,
      );

      user1Tags = await tagsCreatedByUserGet(user1.token);
      expect(user1Tags).toHaveLength(TAGS_PER_TIME_FRAME);

      // Now enough time has passed
      JestDateMock.advanceBy((TAG_CREATION_TIME_FRAME * 1000) / 2 + hoursToMilliseconds(1));

      await createTagPost(
         {
            token: user1.token,
            name: `new test tag`,
            category: "test category 2",
         },
         fakeCtx,
      );

      user1Tags = await tagsCreatedByUserGet(user1.token);
      expect(user1Tags).toHaveLength(TAGS_PER_TIME_FRAME + 1);

      JestDateMock.clear();
   });

   test("Should not be possible to create 2 tags with the same name in the same country", async () => {
      const user = await createFakeUser({ country: "ar" });
      const userOutside = await createFakeUser({ country: "ch" });

      await createTagPost(
         {
            token: user.token,
            name: `duplicated test`,
            category: "test category",
         },
         fakeCtxMuted,
      );

      // Same tag than the previous one
      await createTagPost(
         {
            token: user.token,
            name: `duplicated test`,
            category: "test category",
         },
         fakeCtxMuted,
      );

      // This user is from another country so the tag should be created in this case
      await createTagPost(
         {
            token: userOutside.token,
            name: `duplicated test`,
            category: "test category",
         },
         fakeCtx,
      );

      const userTags = await tagsCreatedByUserGet(user.token);
      expect(userTags).toHaveLength(1);

      const userOutsideTags = await tagsCreatedByUserGet(userOutside.token);
      expect(userOutsideTags).toHaveLength(1);
   });

   test("Subscribing and retrieving subscribed tags works", async () => {
      user1Tags = await tagsGet({ token: user1.token }, fakeCtx);
      const tagIds: string[] = [user1Tags[0].tagId, user1Tags[1].tagId];
      await subscribeToTagPost({
         token: user1.token,
         tagIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(
         user1.tagsSubscribed
            .map(t => t.tagId)
            .sort()
            .join(),
      ).toEqual(tagIds.sort().join());

      expect(user1.tagsBlocked ?? []).toHaveLength(0);
      expect(user2.tagsSubscribed ?? []).toHaveLength(0);
   });

   test("Removing subscription works", async () => {
      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      const originalSubscriptions = [...user1.tagsSubscribed];

      await removeSubscriptionToTagPost({
         token: user1.token,
         tagIds: [originalSubscriptions[0].tagId],
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      expect(
         objectsContentIsEqual(
            user1.tagsSubscribed.map(t => t.tagId),
            [originalSubscriptions[1].tagId],
         ),
      ).toBe(true);

      await subscribeToTagPost({
         token: user1.token,
         tagIds: [originalSubscriptions[0].tagId],
      });
      await subscribeToTagPost({
         token: user2.token,
         tagIds: [originalSubscriptions[0].tagId],
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      await removeSubscriptionToTagPost({
         token: user1.token,
         tagIds: user1.tagsSubscribed.map(t => t.tagId),
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(user1.tagsSubscribed ?? []).toHaveLength(0);
      expect(user2.tagsSubscribed).toHaveLength(1);
   });

   test("Adding and removing block works", async () => {
      user1Tags = await tagsGet({ token: user1.token }, fakeCtx);
      const tagIds: string[] = [user1Tags[0].tagId];
      await blockTagPost({
         token: user1.token,
         tagIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(
         objectsContentIsEqual(
            tagIds,
            user1.tagsBlocked.map(t => t.tagId),
         ),
      ).toBe(true);

      expect(user2.tagsBlocked ?? []).toHaveLength(0);

      await removeBlockToTagPost({
         token: user1.token,
         tagIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      expect(user1.tagsBlocked ?? []).toHaveLength(0);
   });

   test("Removing tag is possible when it has no interactions and not possible when has", async () => {
      user1Tags = await tagsCreatedByUserGet(user1.token);
      const tagIds: string[] = [user1Tags[0].tagId, user1Tags[1].tagId];

      await subscribeToTagPost({
         token: user2.token,
         tagIds: [tagIds[0]],
      });

      await blockTagPost({
         token: user2.token,
         tagIds: [tagIds[1]],
      });

      await removeTagsPost({ token: user1.token, tagIds: [tagIds[0]] }, fakeCtxMuted);

      expect(await tagsCreatedByUserGet(user1.token)).toHaveLength(user1Tags.length);

      await removeSubscriptionToTagPost({
         token: user2.token,
         tagIds,
      });

      await removeBlockToTagPost({
         token: user2.token,
         tagIds,
      });

      await removeSubscriptionToTagPost({
         token: user1.token,
         tagIds,
      });

      await removeBlockToTagPost({
         token: user1.token,
         tagIds,
      });

      await removeTagsPost({ token: user1.token, tagIds }, fakeCtx);

      expect(await tagsCreatedByUserGet(user1.token)).toHaveLength(user1Tags.length - tagIds.length);
   });

   test(`Subscribing to more tags than MAX_TAG_SUBSCRIPTIONS_ALLOWED is not possible for the same country`, async () => {
      let user = await createFakeUser({ country: "ar" });
      const tags: Tag[] = [];

      // Create the maximum amount of tags for 'ar' country
      for (let i = 0; i < MAX_TAG_SUBSCRIPTIONS_ALLOWED; i++) {
         const tempUser = await createFakeUser({ country: "ar" });
         tags.push(
            await createTagPost(
               { token: tempUser.token, name: `max test tag ${i}`, category: `max test category ${i}` },
               fakeCtx,
            ),
         );
      }

      await subscribeToTagPost({ token: user.token, tagIds: tags.map(t => t.tagId) });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);

      expect(user.tagsSubscribed).toHaveLength(MAX_TAG_SUBSCRIPTIONS_ALLOWED);

      // Create one more tag and this one should not be possible to subscribe
      const tempUser2 = await createFakeUser({ country: "ar" });
      const finalTag = await createTagPost(
         { token: tempUser2.token, name: `max test tag final`, category: `max test category final` },
         fakeCtx,
      );

      await subscribeToTagPost({ token: user.token, tagIds: [finalTag.tagId] });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);
      expect(user.tagsSubscribed).toHaveLength(MAX_TAG_SUBSCRIPTIONS_ALLOWED);

      // Create one more tag but this one in a different country and should be possible to subscribe
      const tempUser3 = await createFakeUser({ country: "ru" });
      const otherCountryTag = await createTagPost(
         { token: tempUser3.token, name: `max test tag final`, category: `max test category final` },
         fakeCtx,
      );

      await subscribeToTagPost({ token: user.token, tagIds: [otherCountryTag.tagId] });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);
      expect(user.tagsSubscribed).toHaveLength(MAX_TAG_SUBSCRIPTIONS_ALLOWED + 1);
   });

   test("Admin users can create unlimited tags", async () => {
      const adminUser = await createFakeUser2({ isAdmin: true });

      for (let i = 0; i < TAGS_PER_TIME_FRAME + 2; i++) {
         await createTagPost(
            {
               token: adminUser.token,
               name: `admin user test tag ${i}`,
               category: "test category 1",
            },
            fakeCtx,
         );
      }

      const tags = await tagsCreatedByUserGet(adminUser.token);

      expect(tags).toHaveLength(TAGS_PER_TIME_FRAME + 2);
   });

   test("Unrelated user created at the beginning of the test was not affected", async () => {
      const tags = await tagsCreatedByUserGet(userUnrelated.token);
      expect(tags).toHaveLength(TAGS_PER_TIME_FRAME);
   });

   afterAll(async () => {
      const testUsers = getAllTestUsersCreated();
      await queryToRemoveUsers(testUsers);
      await removeAllTagsCreatedBy(testUsers);
   });
});
