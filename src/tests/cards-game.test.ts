import { fromAgeToBirthDate } from "./../common-tools/math-tools/date-tools";
import "jest";
import {
   dislikedUsersGet,
   notifyAllUsersAboutNewCards,
   recommendationsGet,
} from "../components/cards-game/models";
import { setAttractionPost, userGet, userPost } from "../components/user/models";
import { queryToRemoveUsers } from "../components/user/queries";
import { AttractionType, Gender, User } from "../shared-tools/endpoints-interfaces/user";
import { fakeCtx } from "./tools/replacements";
import { createdUsersMatchesFakeData } from "./tools/reusable-tests";
import {
   createFakeCompatibleUsers,
   createFakeUser,
   createMultipleFakeCustomUsers,
   generateRandomUserProps,
   getAllTestUsersCreated,
   setAttraction,
} from "./tools/users";
import { DeepPartial } from "ts-essentials";
import {
   blockTagsPost,
   createTagPost,
   removeAllTagsCreatedBy,
   subscribeToTagsPost,
   tagsCreatedByUserGet,
} from "../components/tags/models";
import { NON_SEARCHER_LIKING_CHUNK, SEARCHER_LIKING_CHUNK } from "../configurations";

describe("Cards game", () => {
   let usersDataCompatible: Array<DeepPartial<User>>;
   let usersDataIncompatible: Array<DeepPartial<User>>;
   let allUsersData: Array<DeepPartial<User>>;
   let fakeUsers: User[] = [];
   let searcherUser: User;
   let recommendations: User[];

   const searcherParams: DeepPartial<User> = {
      ...generateRandomUserProps(),
      name: "searcher user",
      profileDescription: "",
      birthDate: fromAgeToBirthDate(32),
      height: 265,
      locationLat: -34.608404,
      locationLon: -58.387697,
      targetAgeMin: 20,
      targetAgeMax: 38,
      targetDistance: 60,
      images: ["http://test.com/image.jpg"],
      dateIdea: "holis.",
      genders: [Gender.Woman],
      likesGenders: [Gender.Man],
   };

   const compatibleParams: DeepPartial<User> = {
      name: "compatibleParams",
      birthDate: fromAgeToBirthDate(30),
      targetAgeMin: 20,
      targetAgeMax: 40,
      targetDistance: 60,
      locationLat: -34.597917,
      locationLon: -58.412001,
      genders: [Gender.Woman, Gender.Man, Gender.Bigender],
      likesGenders: [Gender.Woman, Gender.Man, Gender.Androgynous],
   };

   const compatible: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "compatible 1",
   };

   const compatible2: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "compatible 2",
      locationLat: -34.608204,
      locationLon: -58.502031,
      genders: [Gender.Man],
      likesGenders: [Gender.Woman],
   };

   // This is incompatible because the distance is too far for the user
   const incompatibleTooFar: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "distance incompatible",
      locationLat: -34.652713,
      locationLon: -59.425083,
   };

   // This is incompatible because his target distance is to low
   const incompatibleWantsCloser: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "distance incompatible",
      targetDistance: 25,
      locationLat: -34.628378,
      locationLon: -58.734897,
   };

   const incompatibleTooOld: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "age incompatible",
      birthDate: fromAgeToBirthDate(40),
   };

   const incompatibleTooYoung: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "age incompatible 2",
      birthDate: fromAgeToBirthDate(18),
   };

   const incompatibleSearcherUserTooOld: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "age incompatible 3",
      targetAgeMin: 18,
      targetAgeMax: 25,
   };

   const incompatibleSearcherUserTooYoung: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      name: "age incompatible 3",
      targetAgeMin: 35,
      targetAgeMax: 48,
   };

   const incompatibleTransGender: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      genders: [Gender.Man, Gender.TransgenderWoman],
      name: "incompatible trans gender",
   };

   const incompatibleCisGender: DeepPartial<User> = {
      ...generateRandomUserProps(),
      ...compatibleParams,
      genders: [Gender.Woman, Gender.Androgynous],
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
      searcherUser = await createFakeUser(searcherParams);
      fakeUsers = await createMultipleFakeCustomUsers(allUsersData);
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
   });

   test("Only the compatible users appear on the recommendations", async () => {
      expect(recommendations).toHaveLength(usersDataCompatible.length);
   });

   test("Incompatible recommendations tests were done correctly", () => {
      createdUsersMatchesFakeData(fakeUsers, allUsersData, true);
   });

   test("Recommendations returns correct users in correct order", async () => {
      // Check amount
      expect(recommendations).toHaveLength(2);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      // Send profile evaluation to search results and try again to make sure evaluated users are not returned
      await setAttraction(searcherUser, recommendations, AttractionType.Dislike);
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
      expect(recommendations).toHaveLength(0);
   });

   test("Disliked users returns the correct data", async () => {
      recommendations = await dislikedUsersGet({ token: searcherUser.token }, fakeCtx);

      // Check amount
      expect(recommendations).toHaveLength(usersDataCompatible.length);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      await queryToRemoveUsers(fakeUsers);
   });

   test("Users gets notified of new cards when they request for it", async () => {
      await queryToRemoveUsers(fakeUsers);

      let mainUser = await createFakeUser();
      const fakeCompatibleUsers = await createFakeCompatibleUsers(mainUser, 10);

      // The test is going to be done correctly
      mainUser = (await userGet({ token: mainUser.token }, fakeCtx)) as User;
      // The welcome notification is not working on tests so we should have 0 notifications
      expect(mainUser.notifications.length).toBe(0);

      // If the user does not request for notifications should be not notified
      await notifyAllUsersAboutNewCards();
      mainUser = (await userGet({ token: mainUser.token }, fakeCtx)) as User;
      expect(mainUser.notifications.length).toBe(0);

      // Here user requests for notifications
      await userPost({ token: mainUser.token, props: { sendNewUsersNotification: 10 } }, fakeCtx);

      // Now it should be notified
      await notifyAllUsersAboutNewCards();
      mainUser = (await userGet({ token: mainUser.token }, fakeCtx)) as User;
      expect(mainUser.notifications.length).toBe(1);

      // Repetition should not add more notifications
      await notifyAllUsersAboutNewCards();
      mainUser = (await userGet({ token: mainUser.token }, fakeCtx)) as User;
      expect(mainUser.notifications.length).toBe(1);

      await queryToRemoveUsers([mainUser]);
      await queryToRemoveUsers(fakeCompatibleUsers);
   });

   test("Users with matching tags appear first", async () => {
      // Only admins can create unlimited tags
      const adminUser = await createFakeUser(undefined, { makeItAdmin: true });
      const searcher = (await createFakeCompatibleUsers(adminUser, 1))[0];

      // Create 5 tags (only admins can create unlimited tags)
      for (let i = 0; i < 5; i++) {
         await createTagPost(
            {
               token: adminUser.token,
               name: `cards test tag ${i}`,
               category: "test category 1",
            },
            fakeCtx,
         );
      }

      // Store the tags
      const tags = await tagsCreatedByUserGet(adminUser.token);
      const tagIds = tags.map(t => t.tagId);

      // Create 5 users compatible but not with tags, so we can test these users will appear last
      await createFakeCompatibleUsers(searcher, 5);

      // Create 3 users that will be compatible in tags, so we can test that these users appear first
      const tagCompatibleUsers = await createFakeCompatibleUsers(searcher, 3);

      // Create a user that blocks the searcher, so we can test that this user also does not appear
      const userShouldNotAppear1 = (await createFakeCompatibleUsers(searcher, 1))[0];
      const userShouldNotAppear2 = (await createFakeCompatibleUsers(searcher, 1))[0];

      // Searcher user subscribes to 2 tags and blocks 1 tag
      await subscribeToTagsPost({ token: searcher.token, tagIds: [tagIds[0], tagIds[1]] }, fakeCtx);
      await blockTagsPost({ token: searcher.token, tagIds: [tagIds[2]] });

      // The user that should appear first does the same than the searcher
      await subscribeToTagsPost(
         {
            token: tagCompatibleUsers[0].token,
            tagIds: [tagIds[0], tagIds[1]],
         },
         fakeCtx,
      );
      await blockTagsPost({ token: tagCompatibleUsers[0].token, tagIds: [tagIds[2]] });

      // This one should appear second because it's subscribed to all tags but does not block any of them
      await subscribeToTagsPost(
         {
            token: tagCompatibleUsers[1].token,
            tagIds: [tagIds[0], tagIds[1], tagIds[3], tagIds[4]],
         },
         fakeCtx,
      );

      // Single coincidence
      await blockTagsPost({
         token: tagCompatibleUsers[2].token,
         tagIds: [tagIds[2]],
      });

      // User subscribed to tag that the searcher blocks
      await subscribeToTagsPost(
         {
            token: userShouldNotAppear1.token,
            tagIds: [tagIds[2]],
         },
         fakeCtx,
      );

      // User blocks tag that the searcher subscribes
      await blockTagsPost({
         token: userShouldNotAppear2.token,
         tagIds: [tagIds[0]],
      });

      recommendations = await recommendationsGet({ token: searcher.token }, fakeCtx);

      expect(recommendations).toHaveLength(9);
      expect(recommendations[0].userId).toBe(tagCompatibleUsers[0].userId);
      expect(recommendations[1].userId).toBe(tagCompatibleUsers[1].userId);
      expect(recommendations[2].userId).toBe(tagCompatibleUsers[2].userId);
   });

   test("Liking users appears in the first places of the results", async () => {
      const searcher = await createFakeUser();
      const nonLikingUsers = await createFakeCompatibleUsers(searcher, NON_SEARCHER_LIKING_CHUNK * 3);
      const likingUsers = await createFakeCompatibleUsers(searcher, SEARCHER_LIKING_CHUNK);

      for (const usr of likingUsers) {
         await setAttractionPost(
            {
               token: usr.token,
               attractions: [{ userId: searcher.userId, attractionType: AttractionType.Like }],
            },
            fakeCtx,
         );
      }

      const tag = await createTagPost(
         {
            token: searcher.token,
            name: `searcher tag`,
            category: "test category 1",
         },
         fakeCtx,
      );
      await subscribeToTagsPost({ token: searcher.token, tagIds: [tag.tagId] }, fakeCtx);

      /*
       * We subscribe the nonLiking users to the same tag to make them appear first, but this should
       * not happen because liking users have their special place.
       */
      for (const usr of nonLikingUsers) {
         await subscribeToTagsPost({ token: usr.token, tagIds: [tag.tagId] }, fakeCtx);
      }

      recommendations = await recommendationsGet({ token: searcher.token }, fakeCtx);

      expect(recommendations.findIndex(u => likingUsers[0].userId === u.userId)).toBeLessThanOrEqual(
         SEARCHER_LIKING_CHUNK + NON_SEARCHER_LIKING_CHUNK,
      );
   });

   afterAll(async () => {
      const testUsers = getAllTestUsersCreated();
      await queryToRemoveUsers(testUsers);
      await removeAllTagsCreatedBy(testUsers);
   });
});
