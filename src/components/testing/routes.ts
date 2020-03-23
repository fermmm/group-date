import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { User } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      let users: Array<Partial<User>> = null;

      try {
         users = await createFakeUsers(300, 666);
      } catch (error) {
         console.log(error);
      }

      ctx.body = `Created ${users.length} fake users`;
   });
}
