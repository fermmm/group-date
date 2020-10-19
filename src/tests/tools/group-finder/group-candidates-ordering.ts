import { MAX_CONNECTIONS_POSSIBLE_IN_REALITY } from '../../../configurations';
import {
   analiceFilterAndSortGroupCandidates,
   GroupsAnalyzedSorted,
} from '../../../components/groups-finder/models';
import {
   getDataCorruptionProblemsInGroupCandidate,
   getAverageConnectionsAmount,
   getConnectionsCountInequalityLevel,
   getConnectionsCoverageAverage,
   getConnectionsMetaconnectionsDistance,
   removeExceedingConnectionsOnGroupCandidate,
   analiceGroupCandidate,
} from '../../../components/groups-finder/tools/group-candidate-analysis';
import { GroupCandidate, GroupCandidateAnalyzed } from '../../../components/groups-finder/tools/types';
import { groupHasMinimumQuality } from '../../../components/groups-finder/tools/group-candidate-analysis';
import {
   createGroupCandidate,
   createAndAddMultipleUsers,
   connectMembersWithNeighbors,
   createAndAddMultipleUsersRandomlyConnected,
   createAndAddOneUser,
   connectMembersAllWithAll,
} from './group-candidate-test-editing';

const createGroupWith2 = () => createGroupCandidate({ amountOfInitialUsers: 2, connectAllWithAll: false });
const createTwoForTwo = () => createAndAddMultipleUsers(createGroupWith2(), 2, [0, 1]);
const createGroupWith3 = () => createGroupCandidate({ amountOfInitialUsers: 3, connectAllWithAll: false });
const createGroupWith4 = () => createGroupCandidate({ amountOfInitialUsers: 4, connectAllWithAll: false });
const createGroupWith5 = () => createGroupCandidate({ amountOfInitialUsers: 5, connectAllWithAll: false });
const createGroupWith12 = () => createGroupCandidate({ amountOfInitialUsers: 12, connectAllWithAll: false });
const createCircleGroupOf12 = () => connectMembersWithNeighbors(createGroupWith12(), true);

const createBigRandomGroup = () =>
   createAndAddMultipleUsersRandomlyConnected({
      amountOfUsers: 12,
      minConnectionsPerUser: 4,
      maxConnectionsPerUser: 9,
   });

const testGroups: Array<{ name: string; group: GroupCandidate }> = [
   {
      name: '2 for 2',
      group: createTwoForTwo(),
   },
   {
      name: '2 for 2 + 1 extra bisexual',
      group: createAndAddOneUser({ group: createTwoForTwo(), connectWith: [1, 0] }),
   },
   {
      name: '2 for 3',
      group: createAndAddMultipleUsers(createGroupWith2(), 3, [0, 1]),
   },
   {
      name: '2 for 4',
      group: createAndAddMultipleUsers(createGroupWith2(), 4, [0, 1]),
   },
   {
      name: '2 for 5',
      group: createAndAddMultipleUsers(createGroupWith2(), 5, [0, 1]),
   },
   {
      name: '2 for 6',
      group: createAndAddMultipleUsers(createGroupWith2(), 6, [0, 1]),
   },
   {
      name: '2 for 8',
      group: createAndAddMultipleUsers(createGroupWith2(), 8, [0, 1]),
   },
   {
      name: '3 for 3',
      group: createAndAddMultipleUsers(createGroupWith3(), 3, [0, 1, 2]),
   },
   {
      name: '3 for 4',
      group: createAndAddMultipleUsers(createGroupWith3(), 4, [0, 1, 2]),
   },
   {
      name: '3 for 5',
      group: createAndAddMultipleUsers(createGroupWith3(), 5, [0, 1, 2]),
   },
   {
      name: '3 for 6',
      group: createAndAddMultipleUsers(createGroupWith3(), 6, [0, 1, 2]),
   },
   {
      name: '3 for 7',
      group: createAndAddMultipleUsers(createGroupWith3(), 7, [0, 1, 2]),
   },
   {
      name: '3 for 8',
      group: createAndAddMultipleUsers(createGroupWith3(), 8, [0, 1, 2]),
   },
   {
      name: '4 for 5',
      group: createAndAddMultipleUsers(createGroupWith4(), 5, [0, 1, 2, 3]),
   },
   {
      name: '4 for 6',
      group: createAndAddMultipleUsers(createGroupWith4(), 6, [0, 1, 2, 3]),
   },
   {
      name: '4 for 7',
      group: createAndAddMultipleUsers(createGroupWith4(), 7, [0, 1, 2, 3]),
   },
   {
      name: '4 for 8',
      group: createAndAddMultipleUsers(createGroupWith4(), 8, [0, 1, 2, 3]),
   },
   {
      name: '4 for 9',
      group: createAndAddMultipleUsers(createGroupWith4(), 9, [0, 1, 2, 3]),
   },
   {
      name: '3 All with all',
      group: createGroupCandidate({ amountOfInitialUsers: 3, connectAllWithAll: true }),
   },
   {
      name: '5 All with all',
      group: connectMembersAllWithAll(createGroupWith5()),
   },
   {
      name: '5 All with all + 1 with 2 connections',
      group: createAndAddOneUser({ group: connectMembersAllWithAll(createGroupWith5()), connectWith: [0, 2] }),
   },
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
      group: createAndAddOneUser({ group: createCircleGroupOf12(), connectWith: 'all' }),
   },
   {
      name: '12 users with 4 to 9 connections',
      group: createBigRandomGroup(),
   },
   {
      name: '12 users with 4 to 9 connections + 1 of 2',
      group: createAndAddOneUser({ group: createBigRandomGroup(), connectWith: [0, 1] }),
   },
];

export function groupAnalysisReport(): GroupAnalysisReport[] {
   return testGroups.map(item => {
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

      const problems: string[] = getDataCorruptionProblemsInGroupCandidate(group);

      return {
         name: group.groupId,
         approvedReport: groupApproved ? 'APPROVED' : 'NOT MINIMUM QUALITY',
         analysis: {
            inequality: Number(inequality.toFixed(2)),
            conCoverage: Number(coverage.toFixed(2)),
            distConMetaconnection: Number(connectionsMetaconnectionsDistance.toFixed(2)),
            conAmount: Number(averageConnections.toFixed(2)),
         },
         problems: problems.length === 0 ? 'OK' : 'GROUP ERROR: ' + problems,
      };
   });
}

export function analiceFilterAndSortReport() {
   const groups = testGroups.map(e => {
      e.group.groupId = e.name;
      return e.group;
   });
   const groupsAnalyzed: GroupsAnalyzedSorted = analiceFilterAndSortGroupCandidates(groups, 0);

   const finalGroups: AnaliceFilterAndSortReport[] = [];
   groupsAnalyzed.forEach(g => {
      const problems: string[] = getDataCorruptionProblemsInGroupCandidate(g);

      finalGroups.push({
         name:
            testGroups.findIndex(e => e.group === g.group) === -1
               ? `${g.group.groupId} [MODIFIED]`
               : g.group.groupId,
         usersAmount: g.group.users.length,
         connAmount: Number(g.analysis.averageConnectionsAmount.toFixed(3)),
         connAmountR: g.analysis.averageConnectionsAmountRounded,
         qualityR: g.analysis.qualityRounded,
         quality: Number(g.analysis.quality.toFixed(3)),
         problems: problems.length === 0 ? 'OK' : 'GROUP ERROR: ' + problems,
      });
   });

   return {
      removedGroups: testGroups.length - groupsAnalyzed.toArray().length,
      finalGroups,
   };
}

export function getTestingGroupsFilteredAndSorted(): GroupCandidateAnalyzed[] {
   const groups = testGroups.map(e => {
      e.group.groupId = e.name;
      return e.group;
   });
   const groupsAnalyzed: GroupsAnalyzedSorted = analiceFilterAndSortGroupCandidates(groups, 0);

   return groupsAnalyzed.toArray();
}

export function getTestingGroups(): GroupCandidateAnalyzed[] {
   return testGroups.map(item => {
      const group: GroupCandidate = item.group;
      group.groupId = item.name;
      return analiceGroupCandidate(group);
   });
}

interface GroupAnalysisReport {
   name: string;
   approvedReport: string;
   analysis: {
      inequality: number;
      conCoverage: number;
      distConMetaconnection: number;
      conAmount: number;
   };
   problems: string[] | string;
}

interface AnaliceFilterAndSortReport {
   name: string;
   usersAmount: number;
   connAmount: number;
   connAmountR: number;
   qualityR: number;
   quality: number;
   problems: string[] | string;
}
