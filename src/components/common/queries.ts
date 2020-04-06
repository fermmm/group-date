import * as gremlin from 'gremlin';
import { process } from 'gremlin';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';

export function getUserTraversalByToken(
   token: string,
   currentTraversal?: Traversal,
): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'token', String(token));
}

export function getUserTraversalByEmail(
   email: string,
   currentTraversal?: Traversal,
): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'email', String(email));
}

export function getUserTraversalById(
   userId: string,
   currentTraversal?: Traversal,
): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'userId', String(userId));
}

export function hasProfileCompleted(
   currentTraversal?: gremlin.process.GraphTraversal,
): gremlin.process.GraphTraversal {
   return currentTraversal.has('user', 'profileCompleted', true);
}

export async function updateUserToken(userEmail: string, newToken: string): Promise<void> {
   await retryOnError(() =>
      g
         .V()
         .has('user', 'email', userEmail)
         .property('token', newToken)
         .next(),
   );

   return Promise.resolve();
}

export async function updateUserProps(
   token: string,
   props: Array<{ key: keyof User; value: UserPropsValueTypes }>,
): Promise<void> {
   await retryOnError(() => {
      let query = getUserTraversalByToken(token);

      for (const prop of props) {
         query = query.property(prop.key, serializeIfNeeded(prop.value));
      }

      return query.next();
   });

   return Promise.resolve();
}

export function getAllUsers(): process.GraphTraversal {
   return g.V().hasLabel('user');
}

export function getAllCompleteUsers(): process.GraphTraversal {
   return getAllUsers().has('profileCompleted', true);
}

/**
 * Only used in tests
 */
export async function removeUsers(users: Array<Partial<User>>): Promise<void> {
   let query: process.GraphTraversal | process.GraphTraversalSource = g;

   for (const user of users) {
      query = query
         .V()
         .has('user', 'userId', user.userId)
         .aggregate('x')
         .cap('x');
   }

   return (query as process.GraphTraversal)
      .unfold()
      .drop()
      .iterate();
}
