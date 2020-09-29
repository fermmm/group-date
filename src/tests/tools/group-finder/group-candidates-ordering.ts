import { MAX_CONNECTIONS_POSSIBLE_IN_REALITY } from '../../../configurations';
import { analiceAndFilterGroupCandidates, GroupsAnalyzedList } from '../../../components/groups-finder/models';
import {
   getDataCorruptionProblemsInGroupCandidate,
   getAverageConnectionsAmount,
   getConnectionsCountInequalityLevel,
   getConnectionsCoverageAverage,
   getConnectionsMetaconnectionsDistance,
   removeExceedingConnectionsOnGroupCandidate,
   analiceGroupCandidate,
} from '../../../components/groups-finder/tools/group-candidate-analysis';
import { GroupCandidate } from '../../../components/groups-finder/tools/types';
import { groupHasMinimumQuality } from '../../../components/groups-finder/tools/group-candidate-analysis';
import {
   createGroupCandidate,
   createAndAddMultipleUsers,
   connectMembersWithNeighbors,
   createAndAddMultipleUsersRandomlyConnected,
   createAndAddOneUser,
   connectMembersAllWithAll,
} from './group-candidate-test-editing';

const groupWith2 = createGroupCandidate({ amountOfInitialUsers: 2, connectAllWithAll: false });
const twoForTwo = createAndAddMultipleUsers(groupWith2, 2, [0, 1]);
const groupWith3 = createGroupCandidate({ amountOfInitialUsers: 3, connectAllWithAll: false });
const groupWith4 = createGroupCandidate({ amountOfInitialUsers: 4, connectAllWithAll: false });
const groupWith5 = createGroupCandidate({ amountOfInitialUsers: 5, connectAllWithAll: false });
const groupWith12 = createGroupCandidate({ amountOfInitialUsers: 12, connectAllWithAll: false });
const circleGroupOf12 = connectMembersWithNeighbors(groupWith12, true);
const big = createAndAddMultipleUsersRandomlyConnected({
   amountOfUsers: 12,
   minConnectionsPerUser: 4,
   maxConnectionsPerUser: 9,
});

const testGroups: Array<{ name: string; group: GroupCandidate } | string> = [
   {
      name: '2 for 2',
      group: twoForTwo,
   },
   {
      name: '2 for 2 + 1 extra bisexual',
      group: createAndAddOneUser({ group: twoForTwo, connectWith: [1, 0] }),
   },
   {
      name: '2 for 3',
      group: createAndAddMultipleUsers(groupWith2, 3, [0, 1]),
   },
   {
      name: '2 for 4',
      group: createAndAddMultipleUsers(groupWith2, 4, [0, 1]),
   },
   {
      name: '2 for 5',
      group: createAndAddMultipleUsers(groupWith2, 5, [0, 1]),
   },
   {
      name: '2 for 6',
      group: createAndAddMultipleUsers(groupWith2, 6, [0, 1]),
   },
   {
      name: '2 for 8',
      group: createAndAddMultipleUsers(groupWith2, 8, [0, 1]),
   },
   '',
   {
      name: '3 for 3',
      group: createAndAddMultipleUsers(groupWith3, 3, [0, 1, 2]),
   },
   {
      name: '3 for 4',
      group: createAndAddMultipleUsers(groupWith3, 4, [0, 1, 2]),
   },
   {
      name: '3 for 5',
      group: createAndAddMultipleUsers(groupWith3, 5, [0, 1, 2]),
   },
   {
      name: '3 for 6',
      group: createAndAddMultipleUsers(groupWith3, 6, [0, 1, 2]),
   },
   {
      name: '3 for 7',
      group: createAndAddMultipleUsers(groupWith3, 7, [0, 1, 2]),
   },
   {
      name: '3 for 8',
      group: createAndAddMultipleUsers(groupWith3, 8, [0, 1, 2]),
   },
   '',
   {
      name: '4 for 5',
      group: createAndAddMultipleUsers(groupWith4, 5, [0, 1, 2, 3]),
   },
   {
      name: '4 for 6',
      group: createAndAddMultipleUsers(groupWith4, 6, [0, 1, 2, 3]),
   },
   {
      name: '4 for 7',
      group: createAndAddMultipleUsers(groupWith4, 7, [0, 1, 2, 3]),
   },
   {
      name: '4 for 8',
      group: createAndAddMultipleUsers(groupWith4, 8, [0, 1, 2, 3]),
   },
   {
      name: '4 for 9',
      group: createAndAddMultipleUsers(groupWith4, 9, [0, 1, 2, 3]),
   },
   '',
   {
      name: '3 All with all',
      group: createGroupCandidate({ amountOfInitialUsers: 3, connectAllWithAll: true }),
   },
   {
      name: '5 All with all',
      group: connectMembersAllWithAll(groupWith5),
   },
   {
      name: '5 All with all + 1 with 2 connections',
      group: createAndAddOneUser({ group: connectMembersAllWithAll(groupWith5), connectWith: [0, 2] }),
   },
   '',
   {
      name: '1 user with 12 connections, the rest have from 2 to 6 connections',
      group: createAndAddOneUser({
         group: createAndAddMultipleUsersRandomlyConnected({
            amountOfUsers: 12,
            minConnectionsPerUser: 2,
            maxConnectionsPerUser: 6,
         }),
         connectWith: 'all',
      }),
   },
   {
      name: '1 user with 12 connections, the rest have 2 other connections',
      group: createAndAddOneUser({ group: circleGroupOf12, connectWith: 'all' }),
   },
   '',
   {
      name: '12 users with 4 to 9 connections',
      group: big,
   },
   {
      name: '12 users with 4 to 9 connections + 1 of 2',
      group: createAndAddOneUser({ group: big, connectWith: [0, 1] }),
   },
];

export function logGroupsTest() {
   console.log('');
   console.log('//////////////////////////////////////////////////');

   testGroups.forEach(item => {
      if (typeof item === 'string') {
         console.log(item);
         return;
      }
      const group: GroupCandidate = item.group;
      group.groupId = item.name;

      const groupTrimmed: GroupCandidate = removeExceedingConnectionsOnGroupCandidate(
         item.group,
         MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
      );

      // Average amount of connections per user, more is a better group as long as inequality is low
      const averageConnections: number = getAverageConnectionsAmount(groupTrimmed);
      // (Not used) If this parameter is very close to 1 the group is no 100% heterosexual because it means everybody likes everybody. Also if the number is too low it means a poorly connected group.
      const coverage: number = getConnectionsCoverageAverage(group);
      // This is the best algorithm to measure the group quality
      const connectionsMetaconnectionsDistance: number = getConnectionsMetaconnectionsDistance(groupTrimmed);
      // (Not used) This is the second best algorithm to measure the group quality
      const inequality: number = getConnectionsCountInequalityLevel(groupTrimmed);

      const groupApproved: boolean = groupHasMinimumQuality(analiceGroupCandidate(group));

      console.log('');
      console.log(`${item.name} ${groupApproved ? '' : '[BAD QUALITY]'}`);
      console.log(
         'Inequality:',
         Number(inequality.toFixed(2)),
         'ConCoverage:',
         Number(coverage.toFixed(2)),
         'DistConMetaconnection:',
         Number(connectionsMetaconnectionsDistance.toFixed(2)),
         'ConAmount:',
         Number(averageConnections.toFixed(2)),
      );
      if (getDataCorruptionProblemsInGroupCandidate(group).length > 0) {
         console.log('GROUP ERROR: ' + getDataCorruptionProblemsInGroupCandidate(group));
      }
   });

   groupOrderingTest();
   console.log('//////////////////////////////////////////////////');
   console.log('');
}

function groupOrderingTest() {
   const testGroupCleaned = testGroups.filter(e => typeof e !== 'string') as Array<{
      name: string;
      group: GroupCandidate;
   }>;

   const groups = testGroupCleaned.map(e => e.group);
   const groupsAnalyzed: GroupsAnalyzedList = analiceAndFilterGroupCandidates(groups, 0);

   console.log('');
   console.log('Removed groups: ' + (testGroupCleaned.length - groupsAnalyzed.toArray().length));
   console.log('');

   groupsAnalyzed.forEach(g => {
      console.log({
         name:
            testGroupCleaned.findIndex(e => e.group === g.group) === -1
               ? `${g.group.groupId} [MODIFIED]`
               : g.group.groupId,
         usersAmount: g.group.users.length,
         connAmount: Number(g.analysis.averageConnectionsAmount.toFixed(3)),
         connAmountR: g.analysis.averageConnectionsAmountRounded,
         qualityR: g.analysis.qualityRounded,
         quality: Number(g.analysis.quality.toFixed(3)),
      });
      if (getDataCorruptionProblemsInGroupCandidate(g.group).length > 0) {
         console.log('GROUP ERROR: ' + getDataCorruptionProblemsInGroupCandidate(g.group));
      }
   });
}