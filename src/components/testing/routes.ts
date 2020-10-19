import * as Router from '@koa/router';
import { g } from '../../common-tools/database-tools/database-manager';
import { executePromises, time } from '../../common-tools/js-tools/js-tools';
import { MIN_GROUP_SIZE } from '../../configurations';
import {
   createAndAddMultipleUsers,
   createGroupCandidate,
} from '../../tests/tools/group-finder/group-candidate-test-editing';
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
} from '../../tests/tools/group-finder/user-creation-tools';
import { queryToGetUserById, queryToRemoveUsers } from '../user/queries';
import { generateId } from '../../common-tools/string-tools/string-tools';
import { generateRandomUserProps } from '../../tests/tools/users';
import {
   analiceFilterAndSortReport,
   groupAnalysisReport,
} from '../../tests/tools/group-finder/group-candidates-ordering';
import { queryToGetGroupCandidates, queryToGetUsersAllowedToBeOnGroups } from '../groups-finder/queries';
import { GroupCandidate, GroupQuality } from '../groups-finder/tools/types';
import { fromQueryToGroupCandidates } from '../groups-finder/tools/data-conversion';

// TODO: Con esto hacer una funcion de stress test util para poder optimizar la query de group finding
export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // await queryToRemoveUsers();
      console.log('//////////////////////////////////////////////////////////////');
      console.log('//////////////////////////////////////////////////////////////');

      console.time('Created groups. Total time elapsed');
      // const groupsCreated = await callGroupFinder(1);

      let groupsFromDatabase: GroupCandidate[] = [];

      /**
       * Call the group finding query
       */
      if (true) {
         groupsFromDatabase = await fromQueryToGroupCandidates(queryToGetGroupCandidates(1, GroupQuality.Good));
      } else {
         // To get multithreading performance make one request to the database per user and send them all at the same time
         const usersToSearchIds: string[] = (await queryToGetUsersAllowedToBeOnGroups(1, GroupQuality.Good)
            .values('userId')
            // .limit(1)
            .toList()) as string[];

         const databaseRequests: Array<() => Promise<void>> = [];
         for (const userId of usersToSearchIds) {
            databaseRequests.push(async () => {
               const newLength: number = groupsFromDatabase.push(
                  ...(await fromQueryToGroupCandidates(
                     queryToGetGroupCandidates(1, GroupQuality.Good, queryToGetUserById(userId)),
                  )),
               );
               console.log(newLength + ' groups found');
            });
         }

         console.log(`${databaseRequests.length} requests for the database`);
         await executePromises(databaseRequests, false);
         console.log(`${groupsFromDatabase.length} possible groups found`);
      }
      console.timeEnd('Created groups. Total time elapsed');
      // ctx.body = `Finished OK`;
   });

   router.get('/testing2', async ctx => {
      console.time('Created users. Total time elapsed');

      const smallGroup = createAndAddMultipleUsers(
         createGroupCandidate({
            amountOfInitialUsers: 0,
            connectAllWithAll: true,
         }),
         200,
         'all',
      );

      await createFullUsersFromGroupCandidate(smallGroup);

      console.timeEnd('Created users. Total time elapsed');

      ctx.body = `Finished OK`;
   });
}
