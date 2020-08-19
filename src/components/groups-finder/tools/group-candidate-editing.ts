import * as Chance from 'chance';
import { copyGroup } from './group-candidate-analysis';

/**
 * Creates a group as a list of user's connections
 * @param initialUsers Empty users to add as the initial users
 */
export function createGroup(initialUsers: number): number[][] {
   const result: number[][] = [];
   for (let i = 0; i < initialUsers; i++) {
      result.push([]);
   }
   return result;
}

/**
 * Adds a user to a group. Returns the changes as a copy.
 * @param groupAsConnections The group as a list of each user's connections
 * @param userConnections The user as a group of connections
 */
export function addUser(groupAsConnections: number[][], userConnections: number[] = []): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   const newUserIndexPos: number = result.push(userConnections) - 1;
   userConnections.forEach(connectedUser => result[connectedUser].push(newUserIndexPos));
   return result;
}

/**
 * Adds many users with the same connections.
 * @param amountOfUsers Amount of users to add
 */
export function addUsers(
   groupAsConnections: number[][],
   amountOfUsers: number,
   userConnections: number[] = [],
): number[][] {
   let result: number[][] = copyGroup(groupAsConnections);
   for (let i = 0; i < amountOfUsers; i++) {
      result = addUser(result, userConnections);
   }
   return result;
}

export function addUsersAndConnectWithAll(groupAsConnections: number[][], amountOfUsers: number): number[][] {
   const connections: number[] = [];
   for (let i = 0; i < groupAsConnections.length; i++) {
      connections.push(i);
   }
   return addUsers(groupAsConnections, amountOfUsers, [...connections]);
}

export function addAUserAndConnectItWithAll(groupAsConnections: number[][]): number[][] {
   return addUsersAndConnectWithAll(groupAsConnections, 1);
}

export function connectUserWithAll(groupAsConnections: number[][], userIndex: number): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   result.forEach((user, i) => {
      if (i !== userIndex && user.indexOf(userIndex) === -1) {
         user.push(userIndex);
      }
   });
   return result;
}

export function connectAllWithAll(groupAsConnections: number[][]): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   result.forEach((user, i) => {
      result.forEach((userToConnect, u) => {
         if (i !== u && user.indexOf(u) === -1) {
            user.push(u);
         }
      });
   });
   return result;
}

export function connectAllWithAllRandomly(
   groupAsConnections: number[][],
   minConnectionsPerUser: number,
   maxConnectionsPerUser: number,
   seed: number = 0,
): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   const chance = new Chance(seed);

   result.forEach((user, i) => {
      const connections: number[] = getRandomArrayIndexes(
         result.length,
         chance.integer({ min: minConnectionsPerUser, max: maxConnectionsPerUser }),
         chance,
         i,
      );
      connections.forEach(connectionIndex => {
         if (user.indexOf(connectionIndex) === -1) {
            user.push(connectionIndex);
         }
      });
   });
   return result;
}

/**
 * Example: Connects 2 with 1 and 3, and so on...
 * @param loop Connect the last one with the first one generating a "circle"
 */
export function connectAllWithNeighbors(groupAsConnections: number[][], loop: boolean = false): number[][] {
   const result: number[][] = copyGroup(groupAsConnections);
   result.forEach((user, i) => {
      if (i - 1 >= 0) {
         if (user.indexOf(i - 1) === -1) {
            user.push(i - 1);
         }
      } else if (loop) {
         if (user.indexOf(result.length - 1) === -1) {
            user.push(result.length - 1);
         }
      }
      if (i + 1 < result.length) {
         if (user.indexOf(i + 1) === -1) {
            user.push(i + 1);
         }
      } else if (loop) {
         if (user.indexOf(0) === -1) {
            user.push(0);
         }
      }
   });
   return result;
}

export function addUsersAndConnectRandomly(params: AddUsersRandomlyParams): number[][] {
   let result: number[][] = copyGroup(params.groupAsConnections ?? []);
   const chance = new Chance(params?.seed ?? 0);
   for (let i = 0; i < params.amountOfUsers; i++) {
      const connections: number[] = getRandomArrayIndexes(
         result.length,
         chance.integer({ min: params.minConnectionsPerUser, max: params.maxConnectionsPerUser }),
         chance,
      );
      result = addUser(result, connections);
   }
   return result;
}

function getRandomArrayIndexes(
   arrayLength: number,
   amount: number,
   chance: Chance.Chance,
   exclude: number = null,
): number[] {
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
   groupAsConnections?: number[][];
   amountOfUsers: number;
   minConnectionsPerUser: number;
   maxConnectionsPerUser: number;
   seed?: number;
}
