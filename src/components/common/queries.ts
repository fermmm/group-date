import * as gremlin from 'gremlin';
import { asUser, serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { GraphTraversal, Traversal, UserFromDatabase } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';

export async function createUser(token: string, email: string): Promise<Partial<User>> {
   return asUser(
      (
         await retryOnError(() =>
            profileAndQuestions(
               getUserTraversalByToken(token)
                  .fold()
                  .coalesce(
                     __.unfold(),
                     __.addV('user')
                        .property('email', email)
                        .property('token', token)
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
         (await retryOnError(() => profileAndQuestions(getUserTraversalByToken(token)).next())).value as UserFromDatabase,
      ),
   );
}

export async function getUserByEmail(email: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await retryOnError(() => profileAndQuestions(getUserTraversalByEmail(email)).next())).value as UserFromDatabase,
      ),
   );
}

function profileAndQuestions(traversal: gremlin.process.GraphTraversal): GraphTraversal {
   return traversal
      .project('profile', 'questions')
      .by(__.valueMap().by(__.unfold()))
      .by(
         __.outE('response')
            .as('response')
            .inV()
            .as('question')
            .select('question', 'response')
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

export async function updateUserProp(token: string, prop: string, value: UserPropsValueTypes): Promise<void> {
   await retryOnError(() =>
      g
         .V()
         .has('user', 'token', String(token))
         .property(prop, serializeIfNeeded(value))
         .next(),
   );

   return Promise.resolve();
}
