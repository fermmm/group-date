import {
   analiceGroupCandidate,
   groupHasMinimumQuality,
   groupSizeIsUnderMinimum,
} from "./group-candidate-analysis";
import { GroupCandidate, GroupCandidateAnalyzed } from "./types";
import { MAX_GROUP_SIZE, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP } from "../../../configurations";
import { generateId } from "../../../common-tools/string-tools/string-tools";
import { UserWithMatches } from "../../../shared-tools/endpoints-interfaces/groups";

export function copyGroupCandidate(group: GroupCandidate, keepSameId: boolean = true): GroupCandidate {
   return {
      groupId: keepSameId ? group.groupId : generateId(),
      users: group.users.map(u => ({ userId: u.userId, matches: [...u.matches] })),
   };
}

/**
 * Returns a new group candidate with the user added. The other users will connect with the new user
 * according to the matches of the new user, in other words ensures the connections are bi-directional.
 */
export function addUserToGroupCandidate(group: GroupCandidate, user: UserWithMatches): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   user.matches.forEach(userMatch =>
      getUserByIdOnGroupCandidate(resultGroup, userMatch).matches.push(user.userId),
   );
   resultGroup.users.push(user);
   return resultGroup;
}

export function getUserByIdOnGroupCandidate(groupCandidate: GroupCandidate, userId: string): UserWithMatches {
   return groupCandidate.users.find(u => u.userId === userId);
}

/**
 * Gets the users of a group candidate but only the ids
 */
export function getUsersFromGroupCandidateAsIdList(groupCandidate: GroupCandidate): string[] {
   return groupCandidate.users.map(u => u.userId);
}

/**
 * Gets the users of a group candidate but only indexes to find them in the group candidate
 */
export function getUsersFromGroupCandidateAsIndexList(groupCandidate: GroupCandidate): number[] {
   return groupCandidate.users.map((u, i) => i);
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

export function disconnectUsers(user1: UserWithMatches, user2: UserWithMatches): void {
   if (user1.matches.indexOf(user2.userId) !== -1) {
      user1.matches.splice(user1.matches.indexOf(user2.userId), 1);
   }
   if (user2.matches.indexOf(user1.userId) !== -1) {
      user2.matches.splice(user2.matches.indexOf(user1.userId), 1);
   }
}

export function removeUsersFromGroupCandidate(
   group: GroupCandidate,
   usersToRemove: UserWithMatches[],
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);

   if (usersToRemove.length === 0) {
      return resultGroup;
   }

   usersToRemove.forEach(u => {
      // Get the user to be removed but take the reference from the new copy of the group
      const user = getUserByIdOnGroupCandidate(resultGroup, u.userId);

      // Disconnect the user from it's matches
      user.matches.forEach(matchUserId => {
         const matchUser = getUserByIdOnGroupCandidate(resultGroup, matchUserId);
         const indexInMatch = matchUser.matches.indexOf(user.userId);
         // Remove the user from the matches list of all other users
         matchUser.matches.splice(indexInMatch, 1);
      });

      // Remove the user from the group
      const userIndex: number = resultGroup.users.findIndex(usr => usr.userId === user.userId);
      resultGroup.users.splice(userIndex, 1);

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

   const iterations: number = resultGroup.users.length;
   for (let i = 0; i < iterations; i++) {
      const usersToRemove = getUsersWithLessConnectionsThan(resultGroup, connectionsAmount);
      if (usersToRemove.length === 0 || resultGroup.users.length === 0) {
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

/**
 * Removes the users with less connections, that tends to improve the group quality. If the quality still
 * does not get over the minimum allowed or the group becomes too small for the slot, then null is returned
 */
export function tryToFixBadQualityGroupIfNeeded(
   group: GroupCandidateAnalyzed,
   slot: number,
): GroupCandidateAnalyzed | null {
   return removeUsersWithLessConnectionsUntil(group, slot, g => groupHasMinimumQuality(g));
}

/**
 * If the group has a size that is more than MAX_GROUP_SIZE then removes the users with less connections until
 * the number of members is equal to MAX_GROUP_SIZE. Returns a copy of the group with this procedure applied.
 * If the quality of the group is below minimum after this removal then null is returned.
 */
export function limitGroupToMaximumSizeIfNeeded(
   group: GroupCandidateAnalyzed,
   slot: number,
): GroupCandidateAnalyzed | null {
   return removeUsersWithLessConnectionsUntil(group, slot, g => g.group.users.length <= MAX_GROUP_SIZE);
}

/**
 * Removes one user from the group multiple times until the provided callback returns true,
 * More than one user could be removed at a time if removing a user generates another with
 * less connections than the minimum allowed.
 *
 * @param group The group to copy and return with users removed
 * @param slot The slot used
 * @param untilCallback A callback that passes the group with one or more less user each time and should return a boolean indicating to stop.
 */
export function removeUsersWithLessConnectionsUntil(
   group: GroupCandidateAnalyzed,
   slot: number,
   untilCallback: (group: GroupCandidateAnalyzed) => boolean,
): GroupCandidateAnalyzed | null {
   if (untilCallback(group) === true) {
      return group;
   }
   let result: GroupCandidate = copyGroupCandidate(group.group);
   const iterations = result.users.length;
   for (let i = 0; i < iterations; i++) {
      result = removeTheUserWithLessConnections(result, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);

      if (groupSizeIsUnderMinimum(result.users.length, slot)) {
         return null;
      }
      const groupAnalysed: GroupCandidateAnalyzed = analiceGroupCandidate(result);
      if (untilCallback(groupAnalysed) === true) {
         return groupAnalysed;
      }
   }
   return null;
}

export function removeUnavailableUsersFromGroup(
   group: GroupCandidateAnalyzed,
   notAvailableUsersOnGroup: UserWithMatches[],
   slot: number,
): GroupCandidateAnalyzed | null {
   // If the "not available" users amount is too much it can be discarded without trying to fix it
   if (groupSizeIsUnderMinimum(group.group.users.length - notAvailableUsersOnGroup.length, slot)) {
      return null;
   }

   // Create a new group candidate removing unavailable users
   let newGroup: GroupCandidate = removeUsersFromGroupCandidate(group.group, notAvailableUsersOnGroup);

   // After users are removed other users should also be removed if their connections amount are too low
   newGroup = removeUsersRecursivelyByConnectionsAmount(newGroup, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);

   /**
    * After removing non available users if the group is not big enough it's ignored.
    * In the future more users might become available to complete the group or it will
    * be "eaten" by small group creations if the remaining users have free slots for
    * small groups
    */
   if (groupSizeIsUnderMinimum(newGroup.users.length, slot)) {
      return null;
   }

   return analiceGroupCandidate(newGroup);
}

/**
 * Returns the users with less connections or the first user if all has the same amount of connections
 */
export function getUsersWithLessConnections(group: GroupCandidate): UserWithMatches[] {
   return group.users.reduce<UserWithMatches[]>((result, user) => {
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

export function getUsersWithLessConnectionsThan(
   group: GroupCandidate,
   connectionsAmount: number,
): UserWithMatches[] {
   return group.users.reduce<UserWithMatches[]>((result, user) => {
      if (user.matches.length < connectionsAmount) {
         result.push(user);
      }
      return result;
   }, []);
}

export interface AddUsersRandomlyParams {
   group?: GroupCandidate;
   amountOfUsers: number;
   minConnectionsPerUser: number;
   maxConnectionsPerUser: number;
}
