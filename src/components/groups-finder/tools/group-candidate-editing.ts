import {
   analiceGroupCandidate,
   copyGroupCandidate,
   groupHasMinimumQuality,
   groupSizeIsUnderMinimum,
} from './group-candidate-analysis';
import { GroupCandidate, GroupCandidateAnalyzed, UserWithMatches } from './types';
import { MINIMUM_CONNECTIONS_TO_BE_ON_GROUP } from '../../../configurations';

/**
 * Returns a new group candidate with the user added. The other users will connect with the new user
 * according to the matches of the new user, in other words ensures the connections are bi-directional.
 */
export function addUserToGroupCandidate(group: GroupCandidate, user: UserWithMatches): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   user.matches.forEach(userMatch =>
      getUserByIdOnGroupCandidate(resultGroup, userMatch).matches.push(user.userId),
   );
   resultGroup.push(user);
   return resultGroup;
}

export function getUserByIdOnGroupCandidate(groupCandidate: GroupCandidate, userId: string): UserWithMatches {
   return groupCandidate.find(u => u.userId === userId);
}

/**
 * Gets the users of a group candidate but only the ids
 */
export function getUsersFromGroupCandidateAsIdList(groupCandidate: GroupCandidate): string[] {
   return groupCandidate.map(u => u.userId);
}

/**
 * Gets the users of a group candidate but only indexes to find them in the group candidate
 */
export function getUsersFromGroupCandidateAsIndexList(groupCandidate: GroupCandidate): number[] {
   return groupCandidate.map((u, i) => i);
}

/**
 * Adds the users to each other's match list. Also does checks to avoid duplication and self connections.
 */
export function connectUsers(user1: UserWithMatches, user2: UserWithMatches): void {
   if (user1.userId === user2.userId) {
      return;
   }

   if (user1.matches.indexOf(user2.userId) === -1) {
      user1.matches.push(user2.userId);
   }

   if (user2.matches.indexOf(user1.userId) === -1) {
      user2.matches.push(user1.userId);
   }
}

export function removeUsersFromGroupCandidate(group: GroupCandidate, users: UserWithMatches[]): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);

   users.forEach(user => {
      // Disconnect the user from it's matches
      user.matches.forEach(matchUserId => {
         const matchUser = getUserByIdOnGroupCandidate(resultGroup, matchUserId);
         const indexInMatch = matchUser.matches.indexOf(user.userId);
         // Remove the user from the matches list of all other users
         if (indexInMatch !== -1) {
            matchUser.matches.splice(indexInMatch, 1);
         }
      });

      // Remove the user from the group
      const userIndex: number = resultGroup.findIndex(u => u.userId === user.userId);
      resultGroup.splice(userIndex, 1);

      // The user should not have any matches becase it was removed from the group
      user.matches = [];
   });

   return resultGroup;
}

/**
 * Removes the users that have less connections than the amount specified in a recursive way:
 *
 * Because each removal can generate more users with lower connections the removal will repeat until
 * there are no more users to remove or the group has no more users.
 * So the resulting group will only have users with equal or more connections than the amount specified.
 */
export function removeUsersRecursivelyByConnectionsAmount(
   group: GroupCandidate,
   connectionsAmount: number,
): GroupCandidate {
   let resultGroup: GroupCandidate = copyGroupCandidate(group);

   const iterations: number = resultGroup.length;
   for (let i = 0; i < iterations; i++) {
      const usersToRemove = getUsersWithLessConnectionsThan(resultGroup, connectionsAmount);
      if (usersToRemove.length === 0 || resultGroup.length === 0) {
         return resultGroup;
      }
      resultGroup = removeUsersFromGroupCandidate(resultGroup, usersToRemove);
   }

   return resultGroup;
}

/**
 * Removes the first user that finds with less connections than the others, if all the users
 * have the same amount of connections removes the first user of the group.
 * When removing a user the others can become less connected than the minimum, these users
 * will be removed too so the minimum connections allowed should be passed to this function.
 */
export function removeTheUserWithLessConnections(
   group: GroupCandidate,
   minimumConnectionsAllowed: number,
): GroupCandidate {
   const lessConnectedUsers: UserWithMatches[] = getUsersWithLessConnections(group);
   let result: GroupCandidate = removeUsersFromGroupCandidate(group, [lessConnectedUsers[0]]);
   result = removeUsersRecursivelyByConnectionsAmount(result, minimumConnectionsAllowed);
   return result;
}

export function getUsersWithLessConnectionsThan(
   group: GroupCandidate,
   connectionsAmount: number,
): UserWithMatches[] {
   return group.reduce<UserWithMatches[]>((result, user) => {
      if (user.matches.length < connectionsAmount) {
         result.push(user);
      }
      return result;
   }, []);
}

/**
 * Removes the users with less connections, that tends to improve the group quality. If the quality still
 * does not get over the minimum allowed or the group becomes too small for the slot, then null is returned
 */
export function tryToFixBadQualityGroup(
   group: GroupCandidateAnalyzed,
   slot: number,
): GroupCandidateAnalyzed | null {
   let result: GroupCandidate = copyGroupCandidate(group.group);
   const iterations = result.length;
   for (let i = 0; i < iterations; i++) {
      result = removeTheUserWithLessConnections(result, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);
      if (groupSizeIsUnderMinimum(result.length, slot)) {
         return null;
      }
      const groupAnalysed: GroupCandidateAnalyzed = analiceGroupCandidate(result);
      if (groupHasMinimumQuality(groupAnalysed)) {
         return groupAnalysed;
      }
   }
   return null;
}

/**
 * Returns the users with less connections or the first user if all has the same amount of connections
 */
export function getUsersWithLessConnections(group: GroupCandidate): UserWithMatches[] {
   return group.reduce<UserWithMatches[]>((result, user) => {
      if (result.length === 0) {
         result = [user];
         return result;
      }
      if (user.matches.length === result[0].matches.length) {
         result.push(user);
         return result;
      }
      if (user.matches.length < result[0].matches.length) {
         result = [user];
         return result;
      }
      return result;
   }, []);
}

export function disconnectUsers(user1: UserWithMatches, user2: UserWithMatches): void {
   if (user1.matches.indexOf(user2.userId) !== -1) {
      user1.matches.splice(user1.matches.indexOf(user2.userId), 1);
   }
   if (user2.matches.indexOf(user1.userId) !== -1) {
      user2.matches.splice(user2.matches.indexOf(user1.userId), 1);
   }
}

export interface AddUsersRandomlyParams {
   group?: GroupCandidate;
   amountOfUsers: number;
   minConnectionsPerUser: number;
   maxConnectionsPerUser: number;
}
