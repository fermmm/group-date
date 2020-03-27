import * as Router from '@koa/router';
import { createFakeUser } from '../../../test/tools/users';
import { Gender, UserPostParams } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      const basicCloseUser: Partial<UserPostParams> = {
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

      const basicCloseUser2: Partial<UserPostParams> = {
         ...basicCloseUser,
         props: {
            ...basicCloseUser.props,
            locationLat: -34.608204,
            locationLon: -58.502031,
            likesWoman: true,
         },
      };

      const tooFarUser: Partial<UserPostParams> = {
         ...basicCloseUser,
         props: {
            ...basicCloseUser.props,
            locationLat: -34.566223,
            locationLon: -59.11482,
         },
      };

      await createFakeUser(basicCloseUser);
      await createFakeUser(basicCloseUser2);
      await createFakeUser(tooFarUser);

      ctx.body = `Finished`;
   });
}
