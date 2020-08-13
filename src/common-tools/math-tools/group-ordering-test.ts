import {
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
} from '../../configurations';
import {
   getAverageConnectionsAmount,
   getConnectionsCountInequalityLevel,
   getConnectionsCoverageAverage,
   getConnectionsMetaconnectionsDistance,
   removeExceedingConnections,
} from './group-analysis';
import { addAUserAndConnectItWithAll, addUsersAndConnectRandomly } from './group-editing';
import { addUser, addUsers, connectAllWithAll, connectAllWithNeighbors, createGroup } from './group-editing';

const groupWith2 = createGroup(2);
const twoForTwo = addUsers(groupWith2, 2, [0, 1]);
const groupWith3 = createGroup(3);
const groupWith4 = createGroup(4);
const groupWith5 = createGroup(5);
const groupWith12 = createGroup(12);
const circleGroupOf12 = connectAllWithNeighbors(groupWith12, true);
const big = addUsersAndConnectRandomly({
   amountOfUsers: 12,
   minConnectionsPerUser: 4,
   maxConnectionsPerUser: 9,
});

const testGroups: Array<{ name: string; values: number[][] } | string> = [
   {
      name: '2 for 2',
      values: twoForTwo,
   },
   {
      name: '2 for 2 + 1 extra bisexual',
      values: addUser(twoForTwo, [1, 0]),
   },
   {
      name: '2 for 3',
      values: addUsers(groupWith2, 3, [0, 1]),
   },
   {
      name: '2 for 4',
      values: addUsers(groupWith2, 4, [0, 1]),
   },
   {
      name: '2 for 5',
      values: addUsers(groupWith2, 5, [0, 1]),
   },
   {
      name: '2 for 6',
      values: addUsers(groupWith2, 6, [0, 1]),
   },
   {
      name: '2 for 8',
      values: addUsers(groupWith2, 8, [0, 1]),
   },
   '',
   {
      name: '3 for 3',
      values: addUsers(groupWith3, 3, [0, 1, 2]),
   },
   {
      name: '3 for 4',
      values: addUsers(groupWith3, 4, [0, 1, 2]),
   },
   {
      name: '3 for 5',
      values: addUsers(groupWith3, 5, [0, 1, 2]),
   },
   {
      name: '3 for 6',
      values: addUsers(groupWith3, 6, [0, 1, 2]),
   },
   {
      name: '3 for 7',
      values: addUsers(groupWith3, 7, [0, 1, 2]),
   },
   {
      name: '3 for 8',
      values: addUsers(groupWith3, 8, [0, 1, 2]),
   },
   '',
   {
      name: '4 for 5',
      values: addUsers(groupWith4, 5, [0, 1, 2, 3]),
   },
   {
      name: '4 for 6',
      values: addUsers(groupWith4, 6, [0, 1, 2, 3]),
   },
   {
      name: '4 for 7',
      values: addUsers(groupWith4, 7, [0, 1, 2, 3]),
   },
   {
      name: '4 for 8',
      values: addUsers(groupWith4, 8, [0, 1, 2, 3]),
   },
   {
      name: '4 for 9',
      values: addUsers(groupWith4, 9, [0, 1, 2, 3]),
   },
   '',
   {
      name: '5 All with all',
      values: connectAllWithAll(groupWith5),
   },
   {
      name: '5 All with all + 1 with 2 connections',
      values: addUser(connectAllWithAll(groupWith5), [0, 2]),
   },
   '',
   {
      name: '1 user with 12 connections, the rest have from 2 to 6 connections',
      values: addAUserAndConnectItWithAll(
         addUsersAndConnectRandomly({
            amountOfUsers: 12,
            minConnectionsPerUser: 2,
            maxConnectionsPerUser: 6,
         }),
      ),
   },
   {
      name: '1 user with 12 connections, the rest have 2 other connections',
      values: addAUserAndConnectItWithAll(circleGroupOf12),
   },
   '',
   {
      name: '12 users with 4 to 9 connections',
      values: big,
   },
   {
      name: '12 users with 4 to 9 connections + 1 of 2',
      values: addUser(big, [0, 1]),
   },
];

export function groupOrderingTest() {
   console.log('');
   testGroups.forEach(item => {
      if (typeof item !== 'string') {
         const group: number[][] = item.values;
         const groupTrimmed: number[][] = removeExceedingConnections(
            item.values,
            MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
         );

         // Este parámetro habla del tamaño del grupo vito desde cada usuario
         const averageConnections: number = getAverageConnectionsAmount(group);
         // Este parámetro habla sobre la diversidad del grupo, si es 1 son grupos lesbian/gay con bi sin hetero.
         // Pero también si el valor es menor a 0.45 significa que el grupo esta poco inter-conectado, poco valor
         const coverage: number = getConnectionsCoverageAverage(group);
         // Este parámetro habla de la calidad del grupo
         const connectionsMetaconnectionsDistance: number = getConnectionsMetaconnectionsDistance(groupTrimmed);
         // Este parámetro también habla de la calidad del grupo
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
      } else {
         console.log(item);
      }
   });
}
