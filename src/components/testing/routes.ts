import * as Router from '@koa/router';
import { createFakeUser } from '../../../test/tools/users';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      ctx.body = `Finished`;
   });
}
