import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { User } from '../../shared-tools/endpoints-interfaces/user';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      let users: Array<Partial<User>> = null;

      try {
         // TODO: Tira un error al crear 1000 fake users, investigar
         users = await createFakeUsers(1000, 1234);
      } catch (error) {
         console.log(error);
      }

      ctx.body = `Created ${users.length} fake users`;
   });
}
