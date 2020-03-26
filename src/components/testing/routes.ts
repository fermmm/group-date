import * as Router from '@koa/router';
import { createFakeUser } from '../../../test/tools/users';
import { User } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await createFakeUser({
         props: {
            locationLat: -34.597917,
            locationLon: -58.412001,
         },
      });
      ctx.body = `Finished`;
   });
}
