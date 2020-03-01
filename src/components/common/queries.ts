import * as gremlin from 'gremlin';
import { asUser } from '../../common-tools/database-tools/data-convertion-tools';
import { __, g } from '../../common-tools/database-tools/database-manager';
import {
   GraphTraversal,
   Traversal,
   UserFromDatabase,
} from '../../common-tools/database-tools/gremlin-typing-tools';
import { User } from '../../common-tools/endpoints-interfaces/user';

export async function createUser(token: string, email: string): Promise<Partial<User>> {
   return asUser(
      (await g
         .addV('user')
         .property('email', email)
         .property('token', token)
         .property('profileCompleted', false)
         .project('profile')
         .by(__.valueMap().by(__.unfold()))
         .next()).value,
   );
}

export async function getUserByToken(token: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser((await profileAndQuestions(getUserTraversalByToken(token)).next()).value as UserFromDatabase),
   );
}

export async function getUserByEmail(email: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser((await profileAndQuestions(getUserTraversalByEmail(email)).next()).value as UserFromDatabase),
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
   await g
      .V()
      .has('user', 'email', userEmail)
      .property('token', newToken)
      .next();

   return Promise.resolve();
}

export async function updateUserProp(token: string, prop: string, value: number | string | boolean): Promise<void> {
   await g
      .V()
      .has('user', 'token', String(token))
      .property(prop, value)
      .next();

   return Promise.resolve();
}

/**
 * Obviously this is only for testing
 */
export async function removeAllUsers(): Promise<void> {
   return g
      .V()
      .drop()
      .iterate();
}
