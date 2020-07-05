import { replaceNaNInfinity } from './general';

/**
 * This function calculates the connections count inequality level with the following logic:
 *
 * Given a set of numbers gets the inequality between them using the formula:
 * "All element's distance from the mean" divided by "maximum possible distance"
 *
 * Examples:
 *
 *    [6,0,0] returns: 1 (total inequality)
 *    [3,3,3] returns: 0 (total equality)
 *    [0,5,1] returns: 0.75
 */
export function getConnectionsCountInequalityLevel(groupAsConnections: number[][]): number {
   const connectionsCount: number[] = groupAsConnections.map(connections => connections.length);
   const lessEqualCase: number[] = getLessEqualCase(connectionsCount);

   const deviation: number = meanAbsoluteDeviation(connectionsCount);
   const maximumDeviation: number = meanAbsoluteDeviation(lessEqualCase);
   let result: number = deviation / maximumDeviation;
   result = replaceNaNInfinity(result, 0);

   return result;
}

/**
 * An average of how many connections each user has divided by the total amount of users.
 * Gives an idea of how connected are the users with the rest of the group with a number from 0 to 1.
 */
export function getConnectionsCoverageAverage(groupAsConnections: number[][]): number {
   let result: number = 0;
   groupAsConnections.forEach(v => {
      // Each user can connect with the total amount of users - 1 (itself)
      result += v.length / (groupAsConnections.length - 1);
   });
   return result / groupAsConnections.length;
}

/**
 * The sum of the amount of connections each user has divided by the total users.
 * Gives an idea of how valuable is a group for their users in terms of amount of connections.
 * The returned value is not normalized, higher value is better group quality.
 *
 * @param maxConnectionsPerUser More connections than this number in a user will not be computed. This is important
 * because in real life a person has time for a limited amount of people, so with this parameter is possible to
 * get the calculation results more similar to a real life situation.
 */
export function getAverageConnectionsAmount(groupAsConnections: number[][]): number {
   let result: number = 0;
   groupAsConnections.forEach(v => {
      result += v.length;
   });
   return result / groupAsConnections.length;
}

/**
 * Metaconnections = The connections of your connections.
 * This functions returns The numeric distance between the connections of a user an the metaconnections amount.
 * The result is then normalized in a range between 0 and 1.
 * In other words this functions returns: "How much people I connect with and how much other people I have to
 * "share" my connections".
 *
 * The number goes from 0 to 1. As higher it is the value the worst is the quality of the group.
 * This is the most important indicator of the quality of a group.
 */
export function getConnectionsMetaconnectionsDistance(groupAsConnections: number[][]): number {
   let result: number = 0;
   groupAsConnections.forEach((distance1, i) => {
      const distance1ConnectionsAmount: number[] = getDistance1UsersConnectionsAmount(groupAsConnections, i);
      let distancesForUser: number = 0;
      distance1ConnectionsAmount.forEach(
         distance2Amount => (distancesForUser += Math.abs(distance1.length - distance2Amount)),
      );
      let distance: number = distancesForUser / distance1.length;
      /**
       * When a user has 0 connections the result is Infinity. We should not replace that infinity with 0
       * because 0 is the "healthiest" result, that's the opposite of what we have in this case. So in case
       * of no connections the distance is the whole group size.
       */
      distance = replaceNaNInfinity(distance, groupAsConnections.length);
      result += distance;
   });

   return result / groupAsConnections.length / groupAsConnections.length;
}

function sum(array: number[]): number {
   let num: number = 0;
   for (let i = 0, l = array.length; i < l; i++) {
      num += array[i];
   }
   return num;
}

function mean(array: number[]): number {
   return sum(array) / array.length;
}

function getLessEqualCase(array: number[]): number[] {
   const max: number = sum(array);
   return array.map((num, i) => (i === 0 ? max : 0));
}

function meanAbsoluteDeviation(array: number[]): number {
   const arrayMean: number = mean(array);
   return mean(
      array.map(num => {
         return Math.abs(num - arrayMean);
      }),
   );
}

/**
 * The connections amount of all the users at distance 1 of the target user.
 */
function getDistance1UsersConnectionsAmount(groupAsConnections: number[][], targetUserIndex: number): number[] {
   const distance1Users: number[] = groupAsConnections[targetUserIndex];
   return distance1Users.map(userDist1 => groupAsConnections[userDist1].length);
}

/**
 * In a group as connections removes the exceeding connections of a user when there are more than the
 * maximum specified.
 */
export function removeExceedingConnections(
   groupAsConnections: number[][],
   maxConnectionsAllowed: number,
): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   result.forEach((userConnections, userIndex) => {
      if (userConnections.length > maxConnectionsAllowed) {
         for (let i = userConnections.length - 1; i >= maxConnectionsAllowed; i--) {
            const otherEndUserConnections: number[] = result[userConnections[i]];
            otherEndUserConnections.splice(otherEndUserConnections.indexOf(userIndex), 1);
            userConnections.splice(i, 1);
         }
      }
   });

   return result;
}

export function copyGroup(groupAsConnections: number[][]): number[][] {
   return groupAsConnections.map(u => [...u]);
}
