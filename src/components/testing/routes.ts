import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { User } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      const users: Array<Partial<User>> = await createFakeUsers(1000, 666);
      ctx.body = `Created ${users.length} fake users`;
   });
}
