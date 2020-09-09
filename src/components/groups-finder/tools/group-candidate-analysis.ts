import { replaceNaNInfinity, roundDecimals } from '../../../common-tools/math-tools/general';
import {
   GROUP_SLOTS_CONFIGS,
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
   MIN_GROUP_SIZE,
} from '../../../configurations';
import { getUserByIdOnGroupCandidate, disconnectUsers } from './group-candidate-editing';
import { GroupCandidate, GroupCandidateAnalyzed, UserWithMatches } from './types';

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
export function getConnectionsCountInequalityLevel(group: GroupCandidate): number {
   const connectionsCount: number[] = group.map(user => user.matches.length);
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
export function getConnectionsCoverageAverage(group: GroupCandidate): number {
   return (
      group.reduce(
         (s, v) =>
            // Each user can connect with the total amount of users - 1 (itself)
            (s += v.matches.length / (group.length - 1)),
         0,
      ) / group.length
   );
}

/**
 * The sum of the amount of connections each user has divided by the total users.
 * Gives an idea of how valuable is a group for their users in terms of amount of connections.
 * The returned value is not normalized, higher value is better group quality.
 */
export function getAverageConnectionsAmount(group: GroupCandidate): number {
   return group.reduce((s, v) => (s += v.matches.length), 0) / group.length;
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
export function getConnectionsMetaconnectionsDistance(group: GroupCandidate): number {
   const result: number = group.reduce((s, distance1) => {
      const distance1ConnectionsAmount: number[] = getMetaconnectionsAmountInGroupCandidate(group, distance1);
      let distancesForUser: number = 0;
      distance1ConnectionsAmount.forEach(
         distance2Amount => (distancesForUser += Math.abs(distance1.matches.length - distance2Amount)),
      );
      let distance: number = distancesForUser / distance1.matches.length;
      /**
       * When a user has 0 connections the result is Infinity. We should not replace that infinity with 0
       * because 0 is the "healthiest" result, that's the opposite of what we have in this case. So in case
       * of no connections the distance is the whole group size.
       */
      distance = replaceNaNInfinity(distance, group.length);
      s += distance;
      return s;
   }, 0);

   return result / group.length / group.length;
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
 * Returns a list with the amount of connections that has each of the users at distance 1 from a given user.
 */
function getMetaconnectionsAmountInGroupCandidate(
   group: GroupCandidate,
   targetUser: UserWithMatches,
): number[] {
   return targetUser.matches.map(userDist1Id => getUserByIdOnGroupCandidate(group, userDist1Id).matches.length);
}

/**
 * In a group candidate removes the exceeding connections of a user when there are more than the
 * maximum specified.
 */
export function removeExceedingConnectionsOnGroupCandidate(
   group: GroupCandidate,
   maxConnectionsAllowed: number,
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   resultGroup.forEach((user, i) => {
      if (user.matches.length > maxConnectionsAllowed) {
         for (let u = user.matches.length - 1; u >= maxConnectionsAllowed; u--) {
            const userToDisconnect = getUserByIdOnGroupCandidate(resultGroup, user.matches[u]);
            disconnectUsers(user, userToDisconnect);
         }
      }
   });
   return resultGroup;
}

/**
 * Returns an object that contains the group and also contains values that are the result
 * of analyzing different features of the group as quality indicators.
 * "Quality" in a group means the amount of connections and their distribution level.
 */
export function analiceGroupCandidate(group: GroupCandidate): GroupCandidateAnalyzed {
   const groupTrimmed: GroupCandidate = removeExceedingConnectionsOnGroupCandidate(
      group,
      MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
   );

   const quality: number = getConnectionsMetaconnectionsDistance(group);
   const qualityRounded: number = roundDecimals(quality);
   const averageConnectionsAmount: number = getAverageConnectionsAmount(groupTrimmed);
   const averageConnectionsAmountRounded: number = Math.round(getAverageConnectionsAmount(groupTrimmed));

   return {
      group,
      analysis: { quality, qualityRounded, averageConnectionsAmount, averageConnectionsAmountRounded },
   };
}

export function copyGroupCandidate(group: GroupCandidate): GroupCandidate {
   return group.map(u => ({ userId: u.userId, matches: [...u.matches] }));
}

export function groupSizeIsUnderMinimum(groupSize: number, slotIndex: number): boolean {
   return groupSize < (GROUP_SLOTS_CONFIGS[slotIndex].minimumSize ?? MIN_GROUP_SIZE);
}

export function groupHasMinimumQuality(group: GroupCandidateAnalyzed): boolean {
   return MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= group.analysis.quality;
}
