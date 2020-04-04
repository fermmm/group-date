import * as gremlin from 'gremlin';
import { process } from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { queryToUser, serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { GraphTraversal, Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';

export async function createUser(token: string, email: string): Promise<Partial<User>> {
   return queryToUser(
      getUserTraversalByToken(token)
         .fold()
         .coalesce(
            __.unfold(),
            __.addV('user')
               .property('email', email)
               .property('token', token)
               .property('userId', uuidv1())
               .property('profileCompleted', false),
         ),
   );
}

export function addQuestionsResponded(traversal: gremlin.process.GraphTraversal): GraphTraversal {
   return traversal
      .project('profile', 'questions')
      .by(__.valueMap().by(__.unfold()))
      .by(
         __.outE('response')
            .as('response')
            .select('response')
            .by(__.valueMap().by(__.unfold()))
            .fold(),
      );
}

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
