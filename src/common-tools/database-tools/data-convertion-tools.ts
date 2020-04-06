import { process } from 'gremlin';
import { addQuestionsRespondedToUserQuery } from '../../components/user/questions/queries';
import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';
import { removePrivacySensitiveUserProps } from '../security-tools/security-tools';
import { retryOnError } from './database-manager';
import { GremlinValueType, SuportedGremlinTypes, UserFromDatabase } from './gremlin-typing-tools';

/**
 * Converts into a User object a gremlin query that should return a single user vertex.
 */
export async function queryToUser(queryOfUser: process.GraphTraversal): Promise<User> {
   return gremlinMapToUser(
      (await retryOnError(() => addQuestionsRespondedToUserQuery(queryOfUser).next())).value,
   );
}

/**
 * Converts a gremlin query that should return a list of users' vertexes into a list of Users as object.
 */
export async function queryToUserList(
   queryOfUsers: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<User[]> {
   queryOfUsers = addQuestionsRespondedToUserQuery(queryOfUsers);
   const resultGremlinOutput = (await retryOnError(() => queryOfUsers.toList())) as UserFromDatabase[];
   return resultGremlinOutput.map(userFromQuery => {
      if (protectPrivacy) {
         return removePrivacySensitiveUserProps(gremlinMapToUser(userFromQuery));
      }
      return gremlinMapToUser(userFromQuery);
   });
}

export function serializeIfNeeded(value: UserPropsValueTypes): SuportedGremlinTypes {
   const type: string = typeof value;

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
      return JSON.stringify(value);
   }

   return value as SuportedGremlinTypes;
}

/**
 * Converts the format of the Gremlin Map output into a User object
 */
function gremlinMapToUser(userFromDatabase: UserFromDatabase): User {
   if (userFromDatabase == null) {
      return null;
   }

   // Add general props
   const result: Record<string, GremlinValueType> = {
      ...mapToObject(userFromDatabase.get('profile')),
   };

   // Add questions:
   const questions = mapToObjectDeep(userFromDatabase.get('questions'));
   if (questions?.length > 0) {
      result.questions = questions;
   }

   // Deserialize serialized values:
   if (result.pictures != null) {
      result.pictures = JSON.parse((result.pictures as unknown) as string);
   }
   if (result.questions != null) {
      for (const question of ((result as unknown) as User).questions) {
         question.incompatibleAnswers = JSON.parse((question.incompatibleAnswers as unknown) as string);
      }
   }

   return (result as unknown) as User;
}

function mapToObject<T>(map: Map<string, T>): Record<string, T> {
   if (map == null) {
      return null;
   }

   const result: Record<string, T> = {};
   map.forEach((v, k) => {
      result[k] = v;
   });

   return result;
}

function mapToObjectDeep(map: Map<any, any> | Array<Map<any, any>>): any {
   if (map instanceof Array) {
      return map.map(v => mapToObjectDeep(v));
   }

   if (!(map instanceof Map)) {
      return map;
   }

   const result: Record<string, any> = {};
   map.forEach((v, k) => {
      result[k] = mapToObjectDeep(v);
   });

   return result;
}
