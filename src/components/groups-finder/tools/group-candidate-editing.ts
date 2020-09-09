import {
   analiceGroupCandidate,
   copyGroupCandidate,
   groupHasMinimumQuality,
   groupSizeIsUnderMinimum,
} from './group-candidate-analysis';
import { chance } from '../../../tests/tools/generalTools';
import { GroupCandidate, GroupCandidateAnalyzed, UserWithMatches } from './types';
import { MINIMUM_CONNECTIONS_TO_BE_ON_GROUP } from '../../../configurations';

/**
 * Creates a group candidate fake user, to use only on tests. Also adds the user to the group and connects other users according to the provided connections array.
 * Returns a copy of the group containing with the changes.
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group candidate (not the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
export function createFakeUserOnGroupCandidate(
   group: GroupCandidate,
   connectWith: number[] = [],
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);

   connectWith = connectWith ?? getUsersFromGroupCandidateAsIndexList(resultGroup);
   const newUser: UserWithMatches = {
      userId: chance.apple_token(),
      matches: connectWith.map(i => group[i].userId),
   };
   newUser.matches.forEach(userMatch =>
      getUserByIdOnGroupCandidate(resultGroup, userMatch).matches.push(newUser.userId),
   );
   resultGroup.push(newUser);
   return resultGroup;
}

/**
 * Creates a group candidate. Only to be used in tests.
 * @param amountOfInitialUsers Unconnected users to create as the initial users
 */
export function createGroupCandidate(amountOfInitialUsers: number): GroupCandidate {
   let resultGroup: GroupCandidate = [];
   for (let i = 0; i < amountOfInitialUsers; i++) {
      resultGroup = createFakeUserOnGroupCandidate(resultGroup, []);
   }
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
 * Creates multiple fake users and adds them to a group candidate.
 * All will have the same provided connections.
 * Only to be used on testing.
 *
 * @param amountOfUsers Amount of users to add
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group (this doesn't work with the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
export function createFakeUsersForGroupCandidate(
   group: GroupCandidate,
   amountOfUsers: number,
   connectWith?: number[],
): GroupCandidate {
   let resultGroup: GroupCandidate = copyGroupCandidate(group);
   connectWith = connectWith ?? getUsersFromGroupCandidateAsIndexList(resultGroup);
   for (let i = 0; i < amountOfUsers; i++) {
      resultGroup = createFakeUserOnGroupCandidate(resultGroup, connectWith);
   }
   return resultGroup;
}

export function connectUserWithAll(groupOfTheUser: GroupCandidate, user: UserWithMatches): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(groupOfTheUser);
   const userFromResultGroup: UserWithMatches = getUserByIdOnGroupCandidate(resultGroup, user.userId);
   resultGroup.forEach(u => {
      connectUsers(userFromResultGroup, u);
   });
   return resultGroup;
}

export function connectAllWithAll(group: GroupCandidate): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   resultGroup.forEach(user => {
      resultGroup.forEach(userToConnect => {
         connectUsers(user, userToConnect);
      });
   });
   return resultGroup;
}

export function connectAllWithAllRandomly(
   group: GroupCandidate,
   minConnectionsPerUser: number,
   maxConnectionsPerUser: number,
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);

   resultGroup.forEach((user, i) => {
      const randomIndexes: number[] = getRandomArrayIndexes(
         resultGroup.length,
         chance.integer({ min: minConnectionsPerUser, max: maxConnectionsPerUser }),
         // Exclude it's own index so it does not get connected with itself
         i,
      );
      randomIndexes.forEach(randomIndex => {
         connectUsers(user, resultGroup[randomIndex]);
      });
   });
   return resultGroup;
}

/**
 * Example: Connects 2 with 1 and 3, and so on...
 * @param loop Connect the last one with the first one generating a "circle"
 */
export function connectAllWithNeighbors(group: GroupCandidate, loop: boolean = false): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   resultGroup.forEach((user, i) => {
      if (i - 1 >= 0) {
         connectUsers(user, resultGroup[i - 1]);
      } else if (loop) {
         connectUsers(user, resultGroup[resultGroup.length - 1]);
      }
      if (i + 1 < resultGroup.length) {
         connectUsers(user, resultGroup[i + 1]);
      } else if (loop) {
         connectUsers(user, resultGroup[0]);
      }
   });
   return resultGroup;
}

/**
 * Creates fake users and adds them to the group, then connects them randomly with the previous members of the group.
 */
export function createFakeUsersAndConnectRandomly(params: AddUsersRandomlyParams): GroupCandidate {
   let resultGroup: GroupCandidate = copyGroupCandidate(params.group ?? []);
   for (let i = 0; i < params.amountOfUsers; i++) {
      const connections: number[] = getRandomArrayIndexes(
         resultGroup.length,
         chance.integer({ min: params.minConnectionsPerUser, max: params.maxConnectionsPerUser }),
      );
      resultGroup = createFakeUserOnGroupCandidate(resultGroup, connections);
   }
   return resultGroup;
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
      user.matches.forEach(match => disconnectUsers(user, getUserByIdOnGroupCandidate(resultGroup, match)));
      // Remove the user from the group
      const userIndex: number = resultGroup.findIndex(u => u.userId === user.userId);
      resultGroup.splice(userIndex, 1);
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
   let result: GroupCandidate = group.group;
   const iterations = result.length;

   for (let i = 0; i < iterations; i++) {
      result = removeTheUserWithLessConnections(group.group, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);
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

function getRandomArrayIndexes(arrayLength: number, amount: number, exclude: number = null): number[] {
   let result: number[] = [];
   for (let i = 0; i < arrayLength; i++) {
      if (i !== exclude) {
         result.push(i);
      }
   }

   result = chance.shuffle(result);
   result = result.slice(0, amount);

   return result;
}

export interface AddUsersRandomlyParams {
   group?: GroupCandidate;
   amountOfUsers: number;
   minConnectionsPerUser: number;
   maxConnectionsPerUser: number;
}
