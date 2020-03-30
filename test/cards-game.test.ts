import 'jest';
import { dislikedUsersGet, recommendationsGet } from '../src/components/cards-game/models';
import { removeUsers } from '../src/components/common/queries';
import { AttractionType, Gender, User, UserPostParams } from '../src/shared-tools/endpoints-interfaces/user';
import { fakeCtx } from './tools/replacements';
import { createFakeUser, setFakeAttraction } from './tools/users';

describe('Cards game', () => {
   let fakeUsers: User[];
   let searcherUser: User;
   let compatibleUser: User;
   let compatibleUser2: User;
   let recommendations: User[];

   beforeAll(async done => {
      const searcherParams: Partial<UserPostParams> = {
         props: {
            name: 'Fernando',
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

      searcherUser = await createFakeUser(searcherParams);
      compatibleUser = await createFakeUser(compatibleParams);
      compatibleUser2 = await createFakeUser(compatibleParams2);

      fakeUsers = [
         searcherUser,
         compatibleUser,
         compatibleUser2,
         await createFakeUser(distanceIncompatibleParams),
         await createFakeUser(sexIncompatibleParams),
         await createFakeUser(sexIncompatibleParams2),
         await createFakeUser(ageIncompatibleParams),
         await createFakeUser(ageIncompatibleParams2),
         await createFakeUser(ageIncompatibleParams3),
         await createFakeUser(questionsIncompatibleParams),
         await createFakeUser(questionsIncompatibleParams2),
      ];

      done();
   });

   test('Test was prepared correctly', () => {
      expect(fakeUsers).toHaveLength(11);

      let allProfilesCompleted: boolean = true;
      fakeUsers.forEach(user => {
         if (!user.profileCompleted) {
            allProfilesCompleted = false;
         }
      });

      expect(allProfilesCompleted).toBe(true);
   });

   test('Recommendations filters correctly', async () => {
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);

      expect(recommendations).toHaveLength(2);

      expect(recommendations[0].userId !== recommendations[1].userId).toBe(true);

      expect(
         recommendations[0].userId === compatibleUser.userId || recommendations[0].userId === compatibleUser2.userId,
      ).toBe(true);

      expect(
         recommendations[1].userId === compatibleUser.userId || recommendations[1].userId === compatibleUser2.userId,
      ).toBe(true);

      await setFakeAttraction(searcherUser, [compatibleUser, compatibleUser2], AttractionType.Dislike);
      recommendations = await recommendationsGet({ token: searcherUser.token }, fakeCtx);
      expect(recommendations).toHaveLength(0);
   });

   test('Disliked users returns the correct data', async () => {
      recommendations = await dislikedUsersGet({ token: searcherUser.token });
      expect(recommendations).toHaveLength(2);
   });

   afterAll(async done => {
      await removeUsers(fakeUsers);
      done();
   });
});
