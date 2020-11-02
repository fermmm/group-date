import 'jest';
import {
   dislikedUsersGet,
   notifyAllUsersAboutNewCards,
   recommendationsGet,
} from '../components/cards-game/models';
import { setAttractionPost, userGet, userPost } from '../components/user/models';
import { queryToRemoveUsers } from '../components/user/queries';
import { AttractionType, Gender, User } from '../shared-tools/endpoints-interfaces/user';
import { amountOfMatchingResponses } from '../shared-tools/user-tools/user-tools';
import { fakeCtx } from './tools/replacements';
import { createdUsersMatchesFakeData } from './tools/reusable-tests';
import {
   createFakeCompatibleUsers,
   createFakeUser,
   generateRandomUserProps,
   getAllTestUsersCreated,
   setAttraction,
} from './tools/users';
import { DeepPartial } from 'ts-essentials';
import { chance } from './tools/generalTools';
import { createFakeUser2 } from './tools/_experimental';
import {
   blockThemePost,
   createThemePost,
   removeAllThemesCreatedBy,
   subscribeToThemePost,
   themesCreatedByUserGet,
} from '../components/themes/models';
import { NON_LIKING_USERS_CHUNK, LIKING_USERS_CHUNK } from '../configurations';

// TODO: Habría que agregar un test que se fije que no te aparezcan usuarios que tenes como match o seen match
describe('Cards game', () => {
   let fakeData: Array<DeepPartial<User>>;
   let fakeUsers: User[] = [];
   let searcherUser: User;
   let compatibleUser: User;
   let compatibleUser2: User;
   let recommendations: User[];

   beforeAll(async () => {
      const searcherParams: DeepPartial<User> = {
         ...generateRandomUserProps(),
         name: 'searcherParams',
         profileDescription: '',
         gender: Gender.Man,
         age: 32,
         height: 265,
         locationLat: -34.608404,
         locationLon: -58.387697,
         targetAgeMin: 20,
         targetAgeMax: 38,
         targetDistance: 30,
         pictures: ['http://test.com/image.jpg'],
         dateIdea: 'holis.',
         likesWomanTrans: false,
         likesManTrans: false,
         likesWoman: true,
         likesMan: false,
         likesOtherGenders: true,
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 2,
               useAsFilter: true,
            },
         ],
      };

      const compatibleParams: DeepPartial<User> = {
         name: 'compatibleParams',
         gender: Gender.Woman,
         likesMan: true,
         likesWoman: false,
         likesManTrans: false,
         likesWomanTrans: false,
         likesOtherGenders: false,
         age: 30,
         targetAgeMin: 20,
         targetAgeMax: 40,
         targetDistance: 25,
         locationLat: -34.597917,
         locationLon: -58.412001,

         questions: [
            {
               questionId: 0,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 3,
               useAsFilter: false,
            },
         ],
      };

      const compatible: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
      };

      const compatible2: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'compatibleParams2',
         locationLat: -34.608204,
         locationLon: -58.502031,
         likesWoman: true,
         questions: searcherParams.questions,
      };

      const distanceIncompatibleParams: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'distanceIncompatibleParams',
         locationLat: -34.566223,
         locationLon: -59.11482,
      };

      const sexIncompatibleParams: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'sexIncompatibleParams',
         gender: Gender.Man,
      };

      const sexIncompatibleParams2: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'sexIncompatibleParams2',
         likesMan: false,
      };

      const ageIncompatibleParams: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'ageIncompatibleParams',
         age: 40,
      };

      const ageIncompatibleParams2: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'ageIncompatibleParams2',
         age: 18,
      };

      const ageIncompatibleParams3: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'ageIncompatibleParams3',
         targetAgeMin: 18,
         targetAgeMax: 25,
      };

      const questionsIncompatibleParams: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'questionsIncompatibleParams',
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 1, // This makes it incompatible
               useAsFilter: false,
            },
         ],
      };

      const questionsIncompatibleParams2: DeepPartial<User> = {
         ...generateRandomUserProps(),
         ...compatibleParams,
         name: 'questionsIncompatibleParams2',
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 2, // This makes it incompatible
               useAsFilter: true,
            },
            {
               questionId: 3,
               answerId: 2,
               useAsFilter: true,
            },
         ],
      };

      fakeData = [
         searcherParams,
         compatible,
         compatible2,
         distanceIncompatibleParams,
         sexIncompatibleParams,
         sexIncompatibleParams2,
         ageIncompatibleParams,
         ageIncompatibleParams2,
         ageIncompatibleParams3,
         questionsIncompatibleParams,
         questionsIncompatibleParams2,
      ];

      for (const data of fakeData) {
         fakeUsers.push(await createFakeUser(data as User));
      }

      searcherUser = fakeUsers[0];
      compatibleUser = fakeUsers[1];
      compatibleUser2 = fakeUsers[2];
   });

   test('Test will be done correctly', () => {
      createdUsersMatchesFakeData(fakeUsers, fakeData, true);
   });

   test('Recommendations works', async () => {
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
      expect(recommendations).toHaveLength(2);
   });

   test('Recommendations returns correct users in correct order', async () => {
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);

      // Check amount
      expect(recommendations).toHaveLength(2);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      // Check order
      expect(recommendations[0].userId === compatibleUser2.userId).toBe(true);
      expect(recommendations[1].userId === compatibleUser.userId).toBe(true);

      const matchingResponsesWithUser1 = amountOfMatchingResponses(searcherUser, recommendations[0], {
         onlyCardOrderingQuestions: true,
      });
      const matchingResponsesWithUser2 = amountOfMatchingResponses(searcherUser, recommendations[1], {
         onlyCardOrderingQuestions: true,
      });

      // Check amount of matching responses
      expect(matchingResponsesWithUser1).toBeGreaterThanOrEqual(matchingResponsesWithUser2);

      // Send profile evaluation to search results and try again to make sure evaluated users are not returned
      await setAttraction(searcherUser, [compatibleUser, compatibleUser2], AttractionType.Dislike);
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
      expect(recommendations).toHaveLength(0);
   });

   test('Disliked users returns the correct data', async () => {
      recommendations = await dislikedUsersGet({ token: searcherUser.token }, fakeCtx);

      // Check amount
      expect(recommendations).toHaveLength(2);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      // Check order
      expect(recommendations[0].userId === compatibleUser2.userId).toBe(true);
      expect(recommendations[1].userId === compatibleUser.userId).toBe(true);

      await queryToRemoveUsers(fakeUsers);
   });

   test('Order of cards deep query testing is correct', async () => {
      let orderIsCorrect: boolean = true;
      searcherUser = await createFakeUser();
      fakeUsers = [];

      // Generate matching users but with different amount of matching question responses
      for (let i = 0; i < 50; i++) {
         const compatibleQuestions = chance.pickset(
            searcherUser.questions,
            chance.integer({ min: 0, max: searcherUser.questions.length }),
         );

         const newUser = (
            await createFakeCompatibleUsers(searcherUser, 1, {
               questions: compatibleQuestions,
            })
         )[0];

         fakeUsers.push(newUser);
      }

      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);

      for (let i = 0; i < recommendations.length; i++) {
         const nextIndex = i < recommendations.length - 1 ? i + 1 : null;
         if (nextIndex == null) {
            continue;
         }

         const user: User = recommendations[i];
         const followingUser: User = recommendations[nextIndex];

         const userMatches: number = amountOfMatchingResponses(user, searcherUser, {
            onlyCardOrderingQuestions: true,
         });
         const nextUserMatches: number = amountOfMatchingResponses(followingUser, searcherUser, {
            onlyCardOrderingQuestions: true,
         });

         if (userMatches < nextUserMatches) {
            orderIsCorrect = false;
         }
      }

      expect(orderIsCorrect).toBe(true);
      await queryToRemoveUsers(fakeUsers);
   });

   test('Users gets notified of new cards when they request for it', async () => {
      await queryToRemoveUsers(fakeUsers);

      let mainUser = await createFakeUser();
      const fakeCompatibleUsers = await createFakeCompatibleUsers(mainUser, 10);

      // The test is going to be done correctly
      mainUser = (await userGet({ token: mainUser.token }, fakeCtx)) as User;
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

   test('Users with matching themes appear first', async () => {
      const adminUser = await createFakeUser2({ isAdmin: true });
      const searcher = (await createFakeCompatibleUsers(adminUser, 1))[0];

      for (let i = 0; i < 5; i++) {
         await createThemePost(
            {
               token: adminUser.token,
               name: `cards test theme ${i}`,
               category: 'test category 1',
            },
            fakeCtx,
         );
      }

      const themes = await themesCreatedByUserGet(adminUser.token);
      const themeIds = themes.map(t => t.themeId);

      await createFakeCompatibleUsers(searcher, 5);
      const themeCompatibleUsers = await createFakeCompatibleUsers(searcher, 3);

      // Searcher user subscribes to 2 themes and blocks 1 theme
      await subscribeToThemePost({ token: searcher.token, themeIds: [themeIds[0], themeIds[1]] });
      await blockThemePost({ token: searcher.token, themeIds: [themeIds[2]] });

      // The user that should appear first does the same than the searcher
      await subscribeToThemePost({
         token: themeCompatibleUsers[0].token,
         themeIds: [themeIds[0], themeIds[1]],
      });
      await blockThemePost({ token: themeCompatibleUsers[0].token, themeIds: [themeIds[2]] });

      // This one should appear second because it's subscribed to all themes but does not block any of them
      await subscribeToThemePost({
         token: themeCompatibleUsers[1].token,
         themeIds: [themeIds[0], themeIds[1], themeIds[3], themeIds[4]],
      });

      // Single coincidence
      await blockThemePost({
         token: themeCompatibleUsers[2].token,
         themeIds: [themeIds[2]],
      });

      recommendations = await recommendationsGet({ token: searcher.token }, fakeCtx);

      expect(recommendations).toHaveLength(9);
      expect(recommendations[0].userId).toBe(themeCompatibleUsers[0].userId);
      expect(recommendations[1].userId).toBe(themeCompatibleUsers[1].userId);
      expect(recommendations[2].userId).toBe(themeCompatibleUsers[2].userId);
   });

   test('Liking users appears in the first places of the results', async () => {
      const searcher = await createFakeUser();
      const nonLikingUsers = await createFakeCompatibleUsers(searcher, NON_LIKING_USERS_CHUNK * 3);
      const likingUsers = await createFakeCompatibleUsers(searcher, LIKING_USERS_CHUNK);

      for (const usr of likingUsers) {
         await setAttractionPost(
            {
               token: usr.token,
               attractions: [{ userId: searcher.userId, attractionType: AttractionType.Like }],
            },
            fakeCtx,
         );
      }

      const theme = await createThemePost(
         {
            token: searcher.token,
            name: `searcher theme`,
            category: 'test category 1',
         },
         fakeCtx,
      );
      await subscribeToThemePost({ token: searcher.token, themeIds: [theme.themeId] });

      /*
       * We subscribe the nonLiking users to the same theme to make them appear first, but this should
       * not happen because liking users have their special place.
       */
      for (const usr of nonLikingUsers) {
         await subscribeToThemePost({ token: usr.token, themeIds: [theme.themeId] });
      }

      recommendations = await recommendationsGet({ token: searcher.token }, fakeCtx);

      expect(recommendations.findIndex(u => likingUsers[0].userId === u.userId)).toBeLessThanOrEqual(
         LIKING_USERS_CHUNK + NON_LIKING_USERS_CHUNK,
      );
   });

   afterAll(async () => {
      const testUsers = getAllTestUsersCreated();
      await queryToRemoveUsers(testUsers);
      await removeAllThemesCreatedBy(testUsers);
   });
});
