import { asUser, asUserList } from '../../common-tools/database-tools/data-convertion-tools';
import { g } from '../../common-tools/database-tools/database-manager';
import { GremlinResponse } from '../../common-tools/database-tools/gremlin-typing-tools';
import { User } from '../../common-tools/endpoints-interfaces/user';

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

export async function getUserByEmail(email: string): Promise<Partial<User>> {
   return Promise.resolve(
      asUser(
         (await g
            .V()
            .has('user', 'email', email)
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

export async function updateUserToken(userEmail: string, newToken: string): Promise<void> {
   await g
      .V()
      .has('user', 'email', userEmail)
      .property('token', newToken)
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