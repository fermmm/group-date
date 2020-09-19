import * as Router from '@koa/router';
import {
   callGroupCreationMultipleTimes,
   createFullUsersFromGroupCandidate,
   retrieveFinalGroupsOf,
} from '../../tests/tools/group-finder/user-creation-tools';
import { queryToRemoveUsers } from '../user/queries';
import {
   connectMembersWithNeighbors,
   createAndAddOneUser,
   createGroupCandidate,
   createAndAddMultipleUsers,
} from '../../tests/tools/group-finder/group-candidate-test-editing';
import { logGroupsTest } from '../../tests/tools/group-finder/group-candidates-ordering';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      // const fakeUsers = await createFakeUsers(3);
      // const mainUser = fakeUsers[0];

      /*
      let groupWith12 = createGroupCandidate(12);
      groupWith12 = connectAllWithNeighbors(groupWith12, true);
      groupWith12 = createFakeUserOnGroupCandidate(groupWith12);

      await createFullUsersFromGroupCandidate(groupWith12);
      await callGroupSearchMultipleTimes();
      console.log((await getGroupsOfGroupCandidateMembers(groupWith12)).map(g => g.groupId));
*/
      logGroupsTest();
      ctx.body = `Finished OK`;
   });
}
