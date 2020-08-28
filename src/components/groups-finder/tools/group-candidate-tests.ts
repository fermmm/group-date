import {
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
} from '../../../configurations';
import { analiceAndFilterGroupCandidates, sortGroupCandidates } from '../models';
import {
   getAverageConnectionsAmount,
   getConnectionsCountInequalityLevel,
   getConnectionsCoverageAverage,
   getConnectionsMetaconnectionsDistance,
   removeExceedingConnectionsOnGroupCandidate,
} from './group-candidate-analysis';
import { createFakeUserOnGroupCandidate, createFakeUsersAndConnectRandomly } from './group-candidate-editing';
import {
   createFakeUsersForGroupCandidate,
   connectAllWithAll,
   connectAllWithNeighbors,
   createGroupCandidate,
} from './group-candidate-editing';
import { GroupCandidate, GroupCandidateAnalyzed } from './types';

const groupWith2 = createGroupCandidate(2);
const twoForTwo = createFakeUsersForGroupCandidate(groupWith2, 2, [0, 1]);
const groupWith3 = createGroupCandidate(3);
const groupWith4 = createGroupCandidate(4);
const groupWith5 = createGroupCandidate(5);
const groupWith12 = createGroupCandidate(12);
const circleGroupOf12 = connectAllWithNeighbors(groupWith12, true);
const big = createFakeUsersAndConnectRandomly({
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
      group: createFakeUserOnGroupCandidate(twoForTwo, [1, 0]),
   },
   {
      name: '2 for 3',
      group: createFakeUsersForGroupCandidate(groupWith2, 3, [0, 1]),
   },
   {
      name: '2 for 4',
      group: createFakeUsersForGroupCandidate(groupWith2, 4, [0, 1]),
   },
   {
      name: '2 for 5',
      group: createFakeUsersForGroupCandidate(groupWith2, 5, [0, 1]),
   },
   {
      name: '2 for 6',
      group: createFakeUsersForGroupCandidate(groupWith2, 6, [0, 1]),
   },
   {
      name: '2 for 8',
      group: createFakeUsersForGroupCandidate(groupWith2, 8, [0, 1]),
   },
   '',
   {
      name: '3 for 3',
      group: createFakeUsersForGroupCandidate(groupWith3, 3, [0, 1, 2]),
   },
   {
      name: '3 for 4',
      group: createFakeUsersForGroupCandidate(groupWith3, 4, [0, 1, 2]),
   },
   {
      name: '3 for 5',
      group: createFakeUsersForGroupCandidate(groupWith3, 5, [0, 1, 2]),
   },
   {
      name: '3 for 6',
      group: createFakeUsersForGroupCandidate(groupWith3, 6, [0, 1, 2]),
   },
   {
      name: '3 for 7',
      group: createFakeUsersForGroupCandidate(groupWith3, 7, [0, 1, 2]),
   },
   {
      name: '3 for 8',
      group: createFakeUsersForGroupCandidate(groupWith3, 8, [0, 1, 2]),
   },
   '',
   {
      name: '4 for 5',
      group: createFakeUsersForGroupCandidate(groupWith4, 5, [0, 1, 2, 3]),
   },
   {
      name: '4 for 6',
      group: createFakeUsersForGroupCandidate(groupWith4, 6, [0, 1, 2, 3]),
   },
   {
      name: '4 for 7',
      group: createFakeUsersForGroupCandidate(groupWith4, 7, [0, 1, 2, 3]),
   },
   {
      name: '4 for 8',
      group: createFakeUsersForGroupCandidate(groupWith4, 8, [0, 1, 2, 3]),
   },
   {
      name: '4 for 9',
      group: createFakeUsersForGroupCandidate(groupWith4, 9, [0, 1, 2, 3]),
   },
   '',
   {
      name: '5 All with all',
      group: connectAllWithAll(groupWith5),
   },
   {
      name: '5 All with all + 1 with 2 connections',
      group: createFakeUserOnGroupCandidate(connectAllWithAll(groupWith5), [0, 2]),
   },
   '',
   {
      name: '1 user with 12 connections, the rest have from 2 to 6 connections',
      group: createFakeUserOnGroupCandidate(
         createFakeUsersAndConnectRandomly({
            amountOfUsers: 12,
            minConnectionsPerUser: 2,
            maxConnectionsPerUser: 6,
         }),
      ),
   },
   {
      name: '1 user with 12 connections, the rest have 2 other connections',
      group: createFakeUserOnGroupCandidate(circleGroupOf12),
   },
   '',
   {
      name: '12 users with 4 to 9 connections',
      group: big,
   },
   {
      name: '12 users with 4 to 9 connections + 1 of 2',
      group: createFakeUserOnGroupCandidate(big, [0, 1]),
   },
];

export function groupAnalysisTest() {
   console.log('');
   console.log('//////////////////////////////////////////////////');

   testGroups.forEach(item => {
      if (typeof item === 'string') {
         console.log(item);
         return;
      }
      const group: GroupCandidate = item.group;

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

      const groupApproved: boolean =
         MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= connectionsMetaconnectionsDistance;

      console.log('');
      console.log(item.name);
      console.log(
         'Inequality:',
         Number(inequality.toFixed(2)),
         'ConCoverage:',
         Number(coverage.toFixed(2)),
         'DistConMetaconnection:',
         Number(connectionsMetaconnectionsDistance.toFixed(2)),
         'ConAmount:',
         Number(averageConnections.toFixed(2)),
         `${groupApproved ? '' : '[Rejected]'}`,
      );
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

   const groupsAnalyzed: GroupCandidateAnalyzed[] = analiceAndFilterGroupCandidates(groups);

   sortGroupCandidates(groupsAnalyzed);

   console.log(
      groupsAnalyzed.map((g, i) => ({
         name: testGroupCleaned.find(e => e.group === g.group)?.name,
         connAmount: Number(g.analysis.averageConnectionsAmount.toFixed(3)),
         connAmountR: g.analysis.averageConnectionsAmountRounded,
         qualityR: g.analysis.qualityRounded,
         quality: Number(g.analysis.quality.toFixed(3)),
      })),
   );
}
