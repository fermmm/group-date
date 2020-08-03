import { ValueOf } from 'ts-essentials';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User } from '../../shared-tools/endpoints-interfaces/user';

export function queryToGetUserByToken(token: string, currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'token', String(token));
}

export function queryToGetUserByEmail(email: string, currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'email', String(email));
}

export function queryToGetUserById(userId: string, currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'userId', String(userId));
}

export function queryToGetUsersListFromIds(usersIds: string[], currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }
   currentTraversal = currentTraversal.V().hasLabel('user');

   const search = usersIds.map(userId => __.has('userId', userId));
   return currentTraversal.or(...search);
}

/**
 * Receives a user traversal and returns the user only if has the profile completed
 */
export function hasProfileCompleted(currentTraversal?: Traversal): Traversal {
   return currentTraversal.has('user', 'profileCompleted', true);
}

export async function queryToUpdateUserToken(userEmail: string, newToken: string): Promise<void> {
   await retryOnError(() =>
      g
         .V()
         .has('user', 'email', userEmail)
         .property('token', newToken)
         .next(),
   );

   return Promise.resolve();
}

export async function queryToUpdateUserProps(
   token: string,
   props: Array<{ key: keyof User; value: ValueOf<User> }>,
): Promise<void> {
   await retryOnError(() => {
      let query = queryToGetUserByToken(token);

      for (const prop of props) {
         query = query.property(prop.key, serializeIfNeeded(prop.value));
      }

      return query.next();
   });

   return Promise.resolve();
}

export function queryToGetAllUsers(): Traversal {
   return g.V().hasLabel('user');
}

export function queryToGetAllCompleteUsers(): Traversal {
   return queryToGetAllUsers().has('profileCompleted', true);
}

/**
 * Only used in tests.
 * If no user list is provided all users on the database are removed.
 */
export async function queryToRemoveUsers(users?: Array<Partial<User>>): Promise<void> {
   if (users == null) {
      return queryToGetAllUsers()
         .drop()
         .iterate();
   }

   let query: Traversal = g;

   for (const user of users) {
      query = query
         .V()
         .has('user', 'userId', user.userId)
         .aggregate('x')
         .cap('x');
   }

   return (query as Traversal)
      .unfold()
      .drop()
      .iterate();
}
