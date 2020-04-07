import * as Router from '@koa/router';
import { queryToGroup } from '../../common-tools/database-tools/data-convertion-tools';
import { __ } from '../../common-tools/database-tools/database-manager';
import { queryToCreateGroup } from '../groups/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      console.log(await queryToGroup(queryToCreateGroup()));
      ctx.body = `Finished OK`;
   });
}
