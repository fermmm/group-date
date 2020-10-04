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
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { time } from '../../common-tools/js-tools/js-tools';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      console.time('Done. Total time elapsed');

      const smallGroup = createAndAddMultipleUsers(
         createGroupCandidate({
            amountOfInitialUsers: MIN_GROUP_SIZE - 1,
            connectAllWithAll: true,
         }),
         200,
         'all',
      );
      await createFullUsersFromGroupCandidate(smallGroup);

      console.timeEnd('Done. Total time elapsed');
      // ctx.body = `Finished OK`;
   });
}
