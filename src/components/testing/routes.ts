import * as Router from '@koa/router';
import { MIN_GROUP_SIZE } from '../../configurations';
import { User, AttractionType } from '../../shared-tools/endpoints-interfaces/user';
import {
   createAndAddMultipleUsers,
   createGroupCandidate,
} from '../../tests/tools/group-finder/group-candidate-test-editing';
import { createFullUsersFromGroupCandidate } from '../../tests/tools/group-finder/user-creation-tools';
import { createFakeUsers } from '../../tests/tools/users';
import { queryToRemoveUsers, queryToSetAttraction } from '../user/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      console.time('Total time elapsed');
      await queryToRemoveUsers();

      const smallGroup = createAndAddMultipleUsers(
         createGroupCandidate({
            amountOfInitialUsers: MIN_GROUP_SIZE - 1,
            connectAllWithAll: true,
         }),
         300,
         'all',
      );
      const users: User[] = await createFullUsersFromGroupCandidate(smallGroup);

      console.log('ALL DONE');
      console.timeEnd('Total time elapsed');
      ctx.body = `Finished OK`;
   });
}
