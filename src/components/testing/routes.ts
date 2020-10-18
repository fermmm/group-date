import * as Router from '@koa/router';
import { g } from '../../common-tools/database-tools/database-manager';
import { time } from '../../common-tools/js-tools/js-tools';
import { MIN_GROUP_SIZE } from '../../configurations';
import {
   createAndAddMultipleUsers,
   createGroupCandidate,
} from '../../tests/tools/group-finder/group-candidate-test-editing';
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
} from '../../tests/tools/group-finder/user-creation-tools';
import { queryToRemoveUsers } from '../user/queries';
import { generateId } from '../../common-tools/string-tools/string-tools';
import { generateRandomUserProps } from '../../tests/tools/users';
import { logGroupsTest } from '../../tests/tools/group-finder/group-candidates-ordering';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // await queryToRemoveUsers();
      console.time('Done. Total time elapsed');
      logGroupsTest();
      /*
      const smallGroup = createAndAddMultipleUsers(
         createGroupCandidate({
            amountOfInitialUsers: 0,
            connectAllWithAll: true,
         }),
         15,
         'all',
      );
      await createFullUsersFromGroupCandidate(smallGroup);
*/

      /*
      // await time(2000);

      // console.log('Group creation');
      await callGroupFinder(1);

      console.log((await g.V().hasLabel('group').toList()).length);

      // console.log((await g.V().hasLabel('user').both('Match').toList()).length);
      // console.log((await queryToSearchGoodQualityMatchingGroups(1).toList()).length);

      console.timeEnd('Done. Total time elapsed');
      // ctx.body = `Finished OK`;
      */
   });
}
