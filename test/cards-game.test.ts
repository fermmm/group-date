import 'jest';
import { queryToUserList } from '../src/common-tools/database-tools/data-convertion-tools';
import { dislikedUsersGet, recommendationsGet } from '../src/components/cards-game/models';
import { orderResultsByMatchingQuestionAnswers } from '../src/components/cards-game/queries';
import { getAllCompleteUsers, removeUsers } from '../src/components/common/queries';
import { AttractionType, Gender, User, UserPostParams } from '../src/shared-tools/endpoints-interfaces/user';
import { ammountOfMatchingResponses } from '../src/shared-tools/user-tools/user-tools';
import { fakeCtx } from './tools/replacements';
import { fakeUsersMatchesFakeData } from './tools/reusable-tests';
import { createFakeUser, createFakeUsers, setFakeAttraction } from './tools/users';

describe('Cards game', () => {
   let fakeData: Array<Partial<UserPostParams>>;
   let fakeUsers: User[] = [];
   let searcherUser: User;
   let compatibleUser: User;
   let compatibleUser2: User;
   let recommendations: User[];

   beforeAll(async () => {
      const searcherParams: Partial<UserPostParams> = {
         props: {
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
            dateIdeaName: 'Ca futgeg kusuku bihlow honsonaf.',
            dateIdeaAddress: '1324 Focsev Manor',
            likesWomanTrans: false,
            likesManTrans: false,
            likesWoman: true,
            likesMan: false,
            likesOtherGenders: true,
         },
         questions: [
            {
               questionId: 0,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 0,
               useAsFilter: true,
            },
            {
               questionId: 2,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 2,
               useAsFilter: false,
            },
            {
               questionId: 4,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 5,
               answerId: 2,
               useAsFilter: true,
            },
         ],
      };

      const compatibleParams: Partial<UserPostParams> = {
         props: {
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
         },
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 0,
               useAsFilter: true,
            },
            {
               questionId: 2,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 1,
               useAsFilter: true,
            },
            {
               questionId: 4,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 5,
               answerId: 2,
               useAsFilter: false,
            },
         ],
      };

      const compatibleParams2: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'compatibleParams2',
            locationLat: -34.608204,
            locationLon: -58.502031,
            likesWoman: true,
         },
         questions: searcherParams.questions,
      };

      const distanceIncompatibleParams: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'distanceIncompatibleParams',
            locationLat: -34.566223,
            locationLon: -59.11482,
         },
      };

      const sexIncompatibleParams: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'sexIncompatibleParams',
            gender: Gender.Man,
         },
      };

      const sexIncompatibleParams2: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'sexIncompatibleParams2',
            likesMan: false,
         },
      };

      const ageIncompatibleParams: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'ageIncompatibleParams',
            age: 40,
         },
      };

      const ageIncompatibleParams2: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'ageIncompatibleParams2',
            age: 18,
         },
      };

      const ageIncompatibleParams3: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'ageIncompatibleParams3',
            targetAgeMin: 18,
            targetAgeMax: 25,
         },
      };

      const questionsIncompatibleParams: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'questionsIncompatibleParams',
         },
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 3,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 4,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 5,
               answerId: 1, // This makes it incompatible
               useAsFilter: false,
            },
         ],
      };

      const questionsIncompatibleParams2: Partial<UserPostParams> = {
         ...compatibleParams,
         props: {
            ...compatibleParams.props,
            name: 'questionsIncompatibleParams2',
         },
         questions: [
            {
               questionId: 0,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 1,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 2,
               answerId: 0, // This makes it incompatible
               useAsFilter: true,
            },
            {
               questionId: 3,
               answerId: 1,
               useAsFilter: false,
            },
            {
               questionId: 4,
               answerId: 0,
               useAsFilter: false,
            },
            {
               questionId: 5,
               answerId: 2,
               useAsFilter: false,
            },
         ],
      };

      fakeData = [
         searcherParams,
         compatibleParams,
         compatibleParams2,
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
         fakeUsers.push(await createFakeUser(data));
      }

      searcherUser = fakeUsers[0];
      compatibleUser = fakeUsers[1];
      compatibleUser2 = fakeUsers[2];
   });

   test('Test will be done correctly', () => {
      fakeUsersMatchesFakeData(fakeUsers, fakeData);
   });

   test('Recommendations returns correct users in correct order', async () => {
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);

      // Check ammount
      expect(recommendations).toHaveLength(2);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      // Check order
      expect(recommendations[0].userId === compatibleUser2.userId).toBe(true);
      expect(recommendations[1].userId === compatibleUser.userId).toBe(true);

      // Check ammount of matching responses
      expect(
         ammountOfMatchingResponses(searcherUser, recommendations[0]) >=
            ammountOfMatchingResponses(searcherUser, recommendations[1]),
      ).toBe(true);

      // Send profile evaluation to search results and try again to make sure evaluated users are not returned
      await setFakeAttraction(searcherUser, [compatibleUser, compatibleUser2], AttractionType.Dislike);
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
      expect(recommendations).toHaveLength(0);
   });

   test('Disliked users returns the correct data', async () => {
      recommendations = await dislikedUsersGet({ token: searcherUser.token }, fakeCtx);

      // Check ammount
      expect(recommendations).toHaveLength(2);

      // Check for duplication
      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      // Check order
      expect(recommendations[0].userId === compatibleUser2.userId).toBe(true);
      expect(recommendations[1].userId === compatibleUser.userId).toBe(true);

      await removeUsers(fakeUsers);
   });

   test('Order of cards deep query testing is correct', async () => {
      fakeUsers = await createFakeUsers(50);
      searcherUser = fakeUsers[0];

      let query = getAllCompleteUsers();
      query = orderResultsByMatchingQuestionAnswers(query, searcherUser);

      let orderIsCorrect: boolean = true;
      const orderedUsers = await queryToUserList(query);

      expect(orderedUsers.length === fakeUsers.length).toBe(true);

      for (let i = 0; i < orderedUsers.length; i++) {
         const nextIndex = i < orderedUsers.length - 1 ? i + 1 : null;
         if (nextIndex == null) {
            continue;
         }

         const user: User = orderedUsers[i];
         const followingUser: User = orderedUsers[nextIndex];

         const userMatches: number = ammountOfMatchingResponses(user, searcherUser);
         const nextUserMatches: number = ammountOfMatchingResponses(followingUser, searcherUser);

         if (userMatches < nextUserMatches) {
            orderIsCorrect = false;
         }
      }

      expect(orderIsCorrect).toBe(true);
      await removeUsers(fakeUsers);
   });

   afterAll(async () => {
      await removeUsers(fakeUsers);
   });
});