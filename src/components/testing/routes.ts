import * as Router from '@koa/router';
import { createFakeUser, setFakeAttractionMatch } from '../../../test/tools/users';
import { Gender, User, UserPostParams } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      const compatibleUser: Partial<UserPostParams> = {
         props: {
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
            },
            {
               questionId: 5,
               answerId: 2,
            },
         ],
      };

      const compatibleUser2: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            locationLat: -34.608204,
            locationLon: -58.502031,
            likesWoman: true,
         },
      };

      const distanceIncompatibleUser: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            locationLat: -34.566223,
            locationLon: -59.11482,
         },
      };

      const sexIncompatibleUser: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            gender: Gender.Man,
         },
      };

      const sexIncompatibleUser2: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            likesMan: false,
         },
      };

      const ageIncompatibleUser: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            age: 40,
         },
      };

      const ageIncompatibleUser2: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            age: 18,
         },
      };

      const ageIncompatibleUser3: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
            targetAgeMin: 18,
            targetAgeMax: 25,
         },
      };

      const questionsIncompatibleUser: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
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

      const questionsIncompatibleUser2: Partial<UserPostParams> = {
         ...compatibleUser,
         props: {
            ...compatibleUser.props,
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

      const users: User[] = [
         await createFakeUser(compatibleUser),
         await createFakeUser(compatibleUser2),
         await createFakeUser(distanceIncompatibleUser),
         await createFakeUser(sexIncompatibleUser),
         await createFakeUser(sexIncompatibleUser2),
         await createFakeUser(ageIncompatibleUser),
         await createFakeUser(ageIncompatibleUser2),
         await createFakeUser(ageIncompatibleUser3),
         await createFakeUser(questionsIncompatibleUser),
         await createFakeUser(questionsIncompatibleUser2),
      ];

      // await setFakeAttractionMatch(users);

      ctx.body = `Finished`;
   });
}
