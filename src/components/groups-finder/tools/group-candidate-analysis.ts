import { objectsContentIsEqual } from "../../../common-tools/js-tools/js-tools";
import { generateNumberId, replaceNaNInfinity, roundDecimals } from "../../../common-tools/math-tools/general";
import {
   GROUP_SLOTS_CONFIGS,
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
   MIN_GROUP_SIZE,
   REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER,
} from "../../../configurations";
import { getSortFunction, GroupsAnalyzedSorted } from "../models";
import { getUserByIdOnGroupCandidate, disconnectUsers, copyGroupCandidate } from "./group-candidate-editing";
import { GroupCandidate, GroupCandidateAnalyzed } from "./types";
import { checkTypeByMember } from "../../../common-tools/ts-tools/ts-tools";
import { UserWithMatches } from "../../../shared-tools/endpoints-interfaces/groups";

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
   const connectionsCount: number[] = group.users.map(user => user.matches.length);
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
      group.users.reduce(
         (s, u) =>
            // Each user can connect with the total amount of users - 1 (itself)
            (s += u.matches.length / (group.users.length - 1)),
         0,
      ) / group.users.length
   );
}

/**
 * The sum of the amount of connections each user has divided by the total users.
 * Gives an idea of how valuable is a group for their users in terms of amount of connections.
 * The returned value is not normalized, higher value is better group quality.
 */
export function getAverageConnectionsAmount(group: GroupCandidate): number {
   return group.users.reduce((s, v) => (s += v.matches.length), 0) / group.users.length;
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
   const result: number = group.users.reduce((s, distance1) => {
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
      distance = replaceNaNInfinity(distance, group.users.length);
      s += distance;
      return s;
   }, 0);

   return result / group.users.length / group.users.length;
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
   resultGroup.users.forEach((user, i) => {
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
      analysisId: generateNumberId(), // Required by BST to not take same analysis numbers as the same object
   };
}

export function groupSizeIsUnderMinimum(groupSize: number, slotIndex: number): boolean {
   return groupSize < (GROUP_SLOTS_CONFIGS[slotIndex].minimumSize ?? MIN_GROUP_SIZE);
}

export function groupHasMinimumQuality(group: GroupCandidateAnalyzed): boolean {
   return MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= group.analysis.quality;
}

export function userIsPresentOnGroup(group: GroupCandidate, userId: string): boolean {
   return group.users.findIndex(u => u.userId === userId) !== -1;
}

/**
 * Returns a list of strings describing data corruption problems in a group candidate. To be used
 * when testing code. This checks:
 *
 * - All the matches of a user should be present in a group, check for all the users of the group
 * - Matched users should be present in both matches list, unilateral matches are data corruption
 * - Users with 0 matches should not be allowed to be on a group
 * - Users should not have the same match more than once
 * - Users should not have more matches than the amount of members in the group
 * - A user cannot have his own id on the matches list
 * - A user or a match cannot be more than once
 */
export function getDataCorruptionProblemsInGroupCandidate(
   group: GroupCandidate | GroupCandidateAnalyzed,
   maxUsersAllowed: number = null,
): string[] {
   const result = [];

   const gr: GroupCandidate = checkTypeByMember<GroupCandidateAnalyzed>(group, "group") ? group.group : group;

   if (maxUsersAllowed != null && gr.users.length > maxUsersAllowed) {
      result.push(
         `Group has too many users: Users amount: ${gr.users.length} max users to throw this error: ${maxUsersAllowed} groupId: ${gr.groupId}`,
      );
   }

   const evaluatedUser: Set<string> = new Set();
   gr.users.forEach(u => {
      if (evaluatedUser.has(u.userId)) {
         result.push(`User is repeated: ${u.userId}`);
      }
      evaluatedUser.add(u.userId);

      if (u.matches == null) {
         result.push(`User matches array is null: ${u.userId}`);
      }

      if (u.matches.length === 0) {
         result.push(`Has user with 0 matches: ${u.userId}`);
      }

      if (u.matches.length > gr.users.length) {
         result.push(`User has more matches than members in the group: ${u.userId}`);
      }

      const evaluatedMatch: Set<string> = new Set();
      u.matches.forEach(m => {
         if (evaluatedMatch.has(m)) {
            result.push(`User has a repeated match: User: ${u.userId} Match repeated: ${m}`);
         }
         evaluatedMatch.add(m);

         if (u.userId === m) {
            result.push(`User has himself on the matches list: ${u.userId}`);
         }

         if (!userIsPresentOnGroup(gr, m)) {
            result.push(`User has a match that is not present on the group: ${m}`);
            return;
         }
         if (getUserByIdOnGroupCandidate(gr, m).matches.findIndex(um => um === u.userId) === -1) {
            result.push(`User has unilateral match, the user: ${u.userId} is not in the matches of ${m}`);
         }
      });
   });
   return result;
}

export function getDataCorruptionProblemsInMultipleGroupCandidates(
   groups: GroupCandidate[] | GroupsAnalyzedSorted,
): string[][] {
   const result: string[][] = [];

   groups.forEach((g: GroupCandidate | GroupCandidateAnalyzed) => {
      const problems = getDataCorruptionProblemsInGroupCandidate(g);
      if (problems.length > 0) {
         result.push(problems);
      }
   });

   return result;
}

/**
 * Compares the analysis of 2 groups and returns the one with best quality. If both groups have exactly the
 * same quality it returns the first one.
 */
export function getBestGroup(
   group1: GroupCandidateAnalyzed,
   group2: GroupCandidateAnalyzed,
): GroupCandidateAnalyzed {
   if (objectsContentIsEqual(group1.analysis, group2.analysis)) {
      return group1;
   }
   const result = [group1, group2];
   result.sort(getSortFunction(false));
   return result[0];
}

export function reportPossibleDataCorruption(groups: GroupCandidate[] | GroupsAnalyzedSorted) {
   if (REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER) {
      const problems = getDataCorruptionProblemsInMultipleGroupCandidates(groups);
      if (problems.length > 0) {
         console.log(`Database problem! Returned corrupted data in group candidates:`);
         console.log(getDataCorruptionProblemsInMultipleGroupCandidates(groups));
      }
   }
}

/**
 * Removes duplicated groups. Be aware that different order of members are taken as a different group, so you
 * need to make sure the groups comes pre-ordered before calling this.
 */
export function dedupGroupCandidates(groupCandidates: GroupCandidate[]): GroupCandidate[] {
   const evaluated: Set<string> = new Set();
   return groupCandidates.filter(group => {
      const hash: string = getGroupUniqueHash(group);
      if (!evaluated.has(hash)) {
         evaluated.add(hash);
         return true;
      }
      return false;
   });
}

export function getGroupUniqueHash(group: GroupCandidate): string {
   return group.users.reduce((ids, user) => ids + user.userId, "");
}
