import * as Chance from 'chance';
import { User } from '../../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers, setAttractionAllWithAll, setAttractionMatch } from './users';

/**
 * Creates a group of users that are matching between them. You can set the minimum and maximum
 * of matches per user. If this is not set all users matches with all users.
 * @param amount Amount of users to create
 * @param settings Example {connectionsPerUser: {min: 0, max: 3}}
 */
export async function createMatchingUsers(
   amount: number,
   settings?: CreateMatchingUsersRandomSettings,
): Promise<User[]> {
   const users = await createFakeUsers(amount);

   if (settings?.connectionsPerUser == null) {
      await setAttractionAllWithAll(users);
      return users;
   }

   const chance = new Chance(settings.seed || amount);
   for (const user of users) {
      const amountOfUsersToMatch = chance.integer(settings.connectionsPerUser);
      if (amountOfUsersToMatch === 0) {
         continue;
      }
      const usersToMatch = chance.pickset(users, amountOfUsersToMatch);
      await setAttractionMatch(user, usersToMatch);
   }
   return users;
}

/**
 * Matches a user with random users from a users list. You can also set the amount of matches to create.
 * If you don't set the amount of matches then it will match all users of the group.
 * Returns the users that were matched in case that is needed.
 */
export async function matchUserWithUsers(
   user: User,
   usersToMatch: User[],
   amountOfUsersToMatch?: number,
   seed?: number,
): Promise<User[]> {
   const chance = new Chance(seed || amountOfUsersToMatch);
   amountOfUsersToMatch = amountOfUsersToMatch ?? usersToMatch.length;
   const users: User[] = chance.pickset(usersToMatch, amountOfUsersToMatch);
   await setAttractionMatch(user, users);
   return users;
}

/**
 * Matches 2 lists of users together. You can set an amount of connections per user, if this is not set
 * all users from the list 1 will be connected with all the users from the list 2.
 * returns the users of both groups in case is needed.
 */
export async function matchUsersWithUsers(
   usersList1: User[],
   usersList2: User[],
   connectionsPerUser?: number,
   seed?: number,
): Promise<User[]> {
   for (const userFromList1 of usersList1) {
      await matchUserWithUsers(userFromList1, usersList2, connectionsPerUser, seed);
   }
   return [...usersList1, ...usersList2];
}

/**
 * Match users in a chain, so all users have 2 matches except the first and last users that have 1 match.
 * @param connectTheEnds Connect the first user with the last one, forming like a circle group. Default = false
 */
export async function connectUsersInChain(users: User[], connectTheEnds: boolean = false): Promise<void> {
   for (let i = 0; i < users.length; i++) {
      if (i === 0) {
         continue;
      }
      await setAttractionMatch(users[i], [users[i - 1]]);

      if (i === users.length - 1 && connectTheEnds) {
         await setAttractionMatch(users[i], [users[0]]);
      }
   }
}

interface CreateMatchingUsersRandomSettings {
   connectionsPerUser: { min: number; max: number };
   seed?: number;
}
