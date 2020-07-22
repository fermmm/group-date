import * as Router from '@koa/router';
import { Console } from 'console';
import {
   connectUsersInChain,
   createMatchingUsers,
   matchUsersWithUsers,
   matchUserWithUsers,
} from '../../../test/tools/groups';
import { createFakeUser, createFakeUsers, setAttractionMatch } from '../../../test/tools/users';
import { queryToUserList } from '../../common-tools/database-tools/data-conversion-tools';
import { __, g, logComplete } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { getAllUsers, getUserTraversalById, removeUsers } from '../common/queries';
import { getAllPossibleGroups } from '../groups-finder/queries';
import { matchesGet } from '../user/models';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await removeUsers();
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
      await createFakeUsers(3);
      // Create another unrelated group to make sure there is no interference:
      // await createMatchingUsers(5);

      logComplete(await getAllPossibleGroups().toList());

      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}

async function logUserListNames(query: Traversal) {
   console.log((await queryToUserList(query)).map(u => u.name));
}

export function getUserListsDifferences(list1: User[], list2: User[]): User[] {
   const result: User[] = [];
   let largest: User[];
   let smallest: User[];
   if (list1.length > list2.length) {
      largest = list1;
      smallest = list2;
   } else {
      largest = list2;
      smallest = list1;
   }
   for (let i = 0; i < largest.length; i++) {
      const userFromLargest = largest[i];
      const userFromSmallest = smallest[i];
      if (userFromSmallest == null) {
         result.push(userFromLargest);
         continue;
      }
      let foundUser: User = smallest.find(u => u.userId === userFromLargest.userId);
      if (foundUser == null) {
         result.push(userFromLargest);
      }
      foundUser = largest.find(u => u.userId === userFromSmallest.userId);
      if (foundUser == null) {
         result.push(userFromSmallest);
      }
   }
   return result;
}

/**
 * Returns a number between 0 and 1. 0 = Exactly the same. 1 = Completely different.
 */
export function getUserListDifferencesProportion(list1: User[], list2: User[]): number {
   const groupsLength: number = list1.length + list2.length;
   if (groupsLength === 0) {
      return 0;
   }
   const differencesLength: number = getUserListsDifferences(list1, list2).length;
   return differencesLength / groupsLength;
}
