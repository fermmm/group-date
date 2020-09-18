import * as Router from '@koa/router';
import {
   callGroupSearchMultipleTimes,
   createUsersFromGroupCandidate,
   getGroupsOfGroupCandidateMembers,
} from '../../tests/tools/group-finder/user-creation-tools';
import { queryToRemoveUsers } from '../user/queries';
import {
   connectAllWithNeighbors,
   createFakeUserOnGroupCandidate,
   createGroupCandidate,
   createMultipleFakeUsersForGroupCandidate,
} from '../../tests/tools/group-finder/group-candidate-test-editing';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      // const fakeUsers = await createFakeUsers(3);
      // const mainUser = fakeUsers[0];
      let groupWith12 = createGroupCandidate(12);
      groupWith12 = connectAllWithNeighbors(groupWith12, true);
      groupWith12 = createFakeUserOnGroupCandidate(groupWith12);

      await createUsersFromGroupCandidate(groupWith12);
      await callGroupSearchMultipleTimes();
      console.log((await getGroupsOfGroupCandidateMembers(groupWith12)).map(g => g.groupId));

      ctx.body = `Finished OK`;
   });
}
