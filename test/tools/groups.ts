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
 * Returns the users that were matched in case that is needed.
 */
export async function matchUserWithUsers(
   user: User,
   usersToMatch: User[],
   amountOfUsersToMatch: number,
   seed?: number,
): Promise<User[]> {
   const chance = new Chance(seed || amountOfUsersToMatch);
   const users = chance.pickset(usersToMatch, amountOfUsersToMatch);
   await setAttractionMatch(user, users);
   return users;
}

interface CreateMatchingUsersRandomSettings {
   connectionsPerUser: { min: number; max: number };
   seed?: number;
}
