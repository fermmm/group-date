import * as Router from '@koa/router';
import { Console } from 'console';
import {
   connectUsersInChain,
   createMatchingUsers,
   matchUsersWithUsers,
   matchUserWithUsers,
} from '../../tests/tools/groups';
import { createFakeUser, createFakeUsers, setAttractionMatch } from '../../tests/tools/users';
import { __, g, logComplete } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { queryToGetGroupCandidates } from '../groups-finder/queries';
import { matchesGet } from '../user/models';
import { GROUP_SLOTS_CONFIGS } from '../../configurations';
import { fromQueryToGroupCandidates } from '../groups-finder/tools/data-conversion';
import { fromQueryToUserList } from '../user/tools/data-conversion';
import { queryToRemoveUsers } from '../user/queries';
import { GroupQuality } from '../groups-finder/tools/types';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      // const fakeUsers = await createFakeUsers(3);

      // const mainUser = fakeUsers[0];

      // console.log(getUserListDifferencesProportion(fakeUsers, fakeUsers2))

      // const fakeUsers = await createMatchingUsers(2, { connectionsPerUser: { min: 1, max: 2 } });

      // 3 Todos con todos + 1:
      // const allWithAll3: User[] = await createMatchingUsers(3);
      // await matchUserWithUsers(await createFakeUser(), allWithAll3, 1);

      // Cuadrado con 1 de mas
      // const squareGroup: User[] = await matchUsersWithUsers(await createFakeUsers(2), await createFakeUsers(2));
      // await matchUserWithUsers(await createFakeUser(), squareGroup, 1);

      // Chain users with 2 connected users and 1 single matching user
      const fakeUsers = await createFakeUsers(3);
      await connectUsersInChain(fakeUsers);
      const moreConnectedUsers: User[] = await createMatchingUsers(2);
      await matchUserWithUsers(moreConnectedUsers[0], fakeUsers);
      await matchUserWithUsers(moreConnectedUsers[1], fakeUsers);
      await matchUserWithUsers(await createFakeUser(), [moreConnectedUsers[0]]);
      await createFakeUsers(1);
      // Create another unrelated group to make sure there is no interference:
      // await createMatchingUsers(5);

      const result = await fromQueryToGroupCandidates(queryToGetGroupCandidates(0, GroupQuality.Good));
      logComplete(result);

      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
