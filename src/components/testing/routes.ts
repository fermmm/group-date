import * as Router from '@koa/router';
import { queryToRemoveUsers } from '../user/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();

      console.log('ALL DONE');
      ctx.body = `Finished OK`;
   });
}
