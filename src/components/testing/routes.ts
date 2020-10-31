import * as Router from '@koa/router';
import { createFakeUser } from '../../tests/tools/users';
import { queryToRemoveUsers } from '../user/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();
   });

   router.get('/testing2', async ctx => {
      ctx.body = `Finished OK`;
   });
}
