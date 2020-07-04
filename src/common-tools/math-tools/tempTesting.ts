import {
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
} from '../../configurations';
import {
   getAverageConnectionsAmount,
   getConnectionsCountInequalityLevel,
   getConnectionsCoverageAverage,
   getConnectionsMetaconnectionsDistance,
} from './group-analysis';
import { addUser, addUsers, createGroup, removeExceedingConnections } from './group-editing';

const square = [
   [1, 3],
   [0, 2],
   [1, 3],
   [0, 2],
];

const groupWith2 = createGroup(2);
const groupWith3 = createGroup(3);
const groupWith4 = createGroup(4);

// TODO: Implementar una forma de crear estos grupos con funciones faciles de escribir por que despues permite
// mejores testeos

const testGroups: Array<{ name: string; values: number[][] } | string> = [
   {
      name: 'Cuadrado',
      values: square,
   },
   {
      name: 'Pentágono',
      values: [
         [1, 2, 4, 3],
         [0, 2, 4, 3],
         [0, 1, 4, 3],
         [0, 1, 4, 2],
         [0, 1, 2, 3],
      ],
   },
   {
      name: 'Grande',
      values: [
         [1, 4, 5, 6, 11],
         [1, 2, 3, 4, 5, 7, 11],
         [1, 10, 5, 3],
         [1, 2, 10, 8, 5, 4],
         [0, 1, 3, 5, 9],
         [0, 1, 2, 3, 4, 6, 10, 11, 8],
         [0, 5, 7, 9, 11],
         [1, 6, 8, 9, 11],
         [3, 5, 7, 9],
         [4, 6, 7, 8, 10],
         [2, 3, 5, 9, 11],
         [0, 1, 5, 6, 7, 10],
      ],
   },
   '',
   {
      name: 'Cuadrado con 1 de mas BI',
      values: addUser(square, [1, 0]),
   },
   {
      name: 'Cuadrado con 1 de mas',
      values: addUser(square, [1, 3]),
   },
   {
      name: 'Cuadrado con 2 de mas',
      values: addUsers(square, 2, [1, 3]),
   },
   {
      name: 'Cuadrado con 3 de mas',
      values: addUsers(square, 3, [1, 3]),
   },
   '',
   {
      name: '3 para 3',
      values: addUsers(groupWith3, 3, [0, 1, 2]),
   },
   {
      name: '3 para 4',
      values: addUsers(groupWith3, 4, [0, 1, 2]),
   },
   {
      name: '3 para 5',
      values: addUsers(groupWith3, 5, [0, 1, 2]),
   },
   {
      name: '3 para 6',
      values: addUsers(groupWith3, 6, [0, 1, 2]),
   },
   {
      name: '3 para 7',
      values: addUsers(groupWith3, 7, [0, 1, 2]),
   },
   {
      name: '3 para 8',
      values: addUsers(groupWith3, 8, [0, 1, 2]),
   },
   '',
   {
      name: '4 para 5',
      values: addUsers(groupWith4, 5, [0, 1, 2, 3]),
   },
   {
      name: '4 para 6',
      values: addUsers(groupWith4, 6, [0, 1, 2, 3]),
   },
   {
      name: '4 para 7',
      values: addUsers(groupWith4, 7, [0, 1, 2, 3]),
   },
   {
      name: '4 para 8',
      values: addUsers(groupWith4, 8, [0, 1, 2, 3]),
   },
   {
      name: '4 para 9',
      values: addUsers(groupWith4, 9, [0, 1, 2, 3]),
   },
   '',
   {
      name: '2 para 6',
      values: addUsers(groupWith2, 6, [0, 1]),
   },
   '',
   {
      name: 'Pentágono con 1 de mas',
      values: [
         [1, 2, 3, 4, 5],
         [0, 2],
         [0, 1, 3, 4, 5],
         [2, 4, 5, 0],
         [0, 2, 3, 5],
         [0, 2, 3, 4],
      ],
   },
   {
      name: 'Grande con 1 de mas',
      values: [
         [1, 4, 5, 6, 11],
         [1, 2, 3, 4, 5, 7, 11],
         [1, 10, 5, 3, 12],
         [1, 2, 10, 8, 5, 4, 12],
         [0, 1, 3, 5, 9],
         [0, 1, 2, 3, 4, 6, 10, 11, 8],
         [0, 5, 7, 9, 11],
         [1, 6, 8, 9, 11],
         [3, 5, 7, 9],
         [4, 6, 7, 8, 10],
         [2, 3, 5, 9, 11],
         [0, 1, 5, 6, 7, 10],
         [2, 3],
      ],
   },
   {
      name: 'Concentrado Bueno',
      values: [
         [1, 2, 11, 12],
         [0, 11, 12, 3, 2],
         [0, 1, 12, 5, 3],
         [1, 2, 12, 5, 4],
         [5, 6, 12, 3],
         [6, 7, 8, 12, 2, 3, 4],
         [7, 12, 4, 5],
         [6, 5, 12, 11, 8],
         [9, 11, 12, 5, 7],
         [8, 12, 10],
         [9, 7, 12, 11],
         [10, 8, 12, 0, 1],
         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      ],
   },
   '',
   {
      name: 'Concentrado Malo',
      values: [
         [11, 1, 12],
         [0, 2, 12],
         [1, 3, 12],
         [2, 4, 12],
         [3, 5, 12],
         [4, 6, 12],
         [5, 7, 12],
         [6, 8, 12],
         [7, 9, 12],
         [8, 10, 12],
         [9, 11, 12],
         [0, 10, 12],
         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      ],
   },
   {
      name: 'Injusto Hetero',
      values: [
         [8, 9],
         [8, 9],
         [8, 9],
         [8, 9],
         [8, 9],
         [8, 9],
         [8, 9],
         [8, 9],
         [0, 1, 2, 3, 4, 5, 6, 7],
         [0, 1, 2, 3, 4, 5, 6, 7],
      ],
   },
];

export function test() {
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
         // Este parámetro habla sobre la diversidad del grupo, si es 1 son grupos lesb/gay con bi sin hetero.
         const coverage: number = getConnectionsCoverageAverage(group);
         // Este parámetro habla de la calidad del grupo
         const connectionsMetaconnectionsDistance: number = getConnectionsMetaconnectionsDistance(groupTrimmed);
         // Este parámetro también habla de la calidad del grupo
         const inequality: number = getConnectionsCountInequalityLevel(groupTrimmed);

         const groupApproved: boolean =
            MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= connectionsMetaconnectionsDistance;

         console.log(
            `${item.name}:`,
            'ConCountInequality:',
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
