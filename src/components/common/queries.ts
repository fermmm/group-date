import * as gremlin from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { asUser, serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { GraphTraversal, Traversal, UserFromDatabase } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';

export async function createUser(token: string, email: string): Promise<Partial<User>> {
   return asUser(
      (
         await retryOnError(() =>
            addQuestionsResponded(
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
            ).next(),
         )
      ).value,
   );
}

export async function getUserByToken(token: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await retryOnError(() => addQuestionsResponded(getUserTraversalByToken(token)).next())).value as UserFromDatabase,
      ),
   );
}

export async function getUserByEmail(email: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await retryOnError(() => addQuestionsResponded(getUserTraversalByEmail(email)).next())).value as UserFromDatabase,
      ),
   );
}

export async function getUserById(userId: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await retryOnError(() => addQuestionsResponded(getUserTraversalById(userId)).next())).value as UserFromDatabase,
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

export function getUserTraversalByToken(token: string, currentTraversal?: Traversal): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'token', String(token));
}

export function getUserTraversalByEmail(email: string, currentTraversal?: Traversal): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'email', String(email));
}

export function getUserTraversalById(userId: string, currentTraversal?: Traversal): gremlin.process.GraphTraversal {
   if (currentTraversal == null) {
      currentTraversal = g;
   }

   return currentTraversal.V().has('user', 'userId', String(userId));
}

export function hasProfileCompleted(currentTraversal?: gremlin.process.GraphTraversal): gremlin.process.GraphTraversal {
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
      let query = g.V().has('user', 'token', String(token));

      for (const prop of props) {
         query = query.property(prop.key, serializeIfNeeded(prop.value));
      }

      return query.next();
   });

   return Promise.resolve();
}
