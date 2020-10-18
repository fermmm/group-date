import 'jest';
import {
   dislikedUsersGet,
   notifyAllUsersAboutNewCards,
   recommendationsGet,
} from '../components/cards-game/models';
import { queryToOrderResultsByMatchingQuestions } from '../components/cards-game/queries';
import { userGet, userPost } from '../components/user/models';
import { queryToRemoveUsers, queryToGetAllCompleteUsers } from '../components/user/queries';
import { fromQueryToUserList } from '../components/user/tools/data-conversion';
import { AttractionType, Gender, User, UserPostParams } from '../shared-tools/endpoints-interfaces/user';
import { amountOfMatchingResponses } from '../shared-tools/user-tools/user-tools';
import { fakeCtx } from './tools/replacements';
import { createdUsersMatchesFakeData } from './tools/reusable-tests';
import {
   createFakeCompatibleUsers,
   createFakeUser,
   createFakeUsers,
   generateRandomUserProps,
   getAllTestUsersCreated,
   setAttraction,
} from './tools/users';
import { DeepPartial } from 'ts-essentials';

// TODO: Habria que agregar un test que se fije que no te aparezcan usuarios que tenes como match o seenmatch
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
         dateIdeaName: 'holis.',
         dateIdeaAddress: '1324 holis',
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

      // Check amount of matching responses
      expect(
         amountOfMatchingResponses(searcherUser, recommendations[0]) >=
            amountOfMatchingResponses(searcherUser, recommendations[1]),
      ).toBe(true);

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
      fakeUsers = await createFakeUsers(50);
      searcherUser = fakeUsers[0];

      let query = queryToGetAllCompleteUsers();
      query = queryToOrderResultsByMatchingQuestions(query, searcherUser);

      let orderIsCorrect: boolean = true;
      const orderedUsers = await fromQueryToUserList(query);

      expect(orderedUsers.length === fakeUsers.length).toBe(true);

      for (let i = 0; i < orderedUsers.length; i++) {
         const nextIndex = i < orderedUsers.length - 1 ? i + 1 : null;
         if (nextIndex == null) {
            continue;
         }

         const user: User = orderedUsers[i];
         const followingUser: User = orderedUsers[nextIndex];

         const userMatches: number = amountOfMatchingResponses(user, searcherUser);
         const nextUserMatches: number = amountOfMatchingResponses(followingUser, searcherUser);

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

   afterAll(async () => {
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
