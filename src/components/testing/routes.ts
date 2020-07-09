import * as Router from '@koa/router';
import { createMatchingUsers } from '../../../test/tools/groups';
import { createFakeUsers } from '../../../test/tools/users';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { removeUsers } from '../common/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // const fakeUsers = await createFakeUsers(2);

      console.log('hola');
      // const mainUser = fakeUsers[0];

      // console.log(getUserListDifferencesProportion(fakeUsers, fakeUsers2))

      // const fakeUsers = await createMatchingUsers(2, { connectionsPerUser: { min: 1, max: 2 } });
      const fakeUsers = await createMatchingUsers(2);

      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
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
