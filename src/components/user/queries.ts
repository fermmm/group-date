import { g } from '../../common-tools/database-manager';
import { asUser, asUserList } from '../../common-tools/gremlin/data-convertion-tools';
import { GremlinResponse } from '../../common-tools/gremlin/gremlin-typing-tools';
import { User } from './models';

export async function createUser(token: string, email: string): Promise<Partial<User>> {
   const creationResponse: GremlinResponse = await g
      .addV('user')
      .property('email', email)
      .property('token', token)
      .next();
   return Promise.resolve(await getUserByVertexId(creationResponse.value.id));
}

export async function getUserByVertexId(vertexId: number): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await g
            .V(vertexId)
            .valueMap(true)
            .next()).value,
      ),
   );
}

export async function getUserByToken(token: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await g
            .V()
            .has('user', 'token', token)
            .valueMap(true)
            .next()).value,
      ),
   );
}

export async function getAllUsers(): Promise<Array<Partial<User>>> {
   return Promise.resolve(
      asUserList((await g
         .V()
         .hasLabel('user')
         .valueMap(true)
         .toList()) as Array<Map<string, string[]>>),
   );
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