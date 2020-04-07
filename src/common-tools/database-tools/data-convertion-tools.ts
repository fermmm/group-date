import { process } from 'gremlin';
import { addQuestionsRespondedToUserQuery } from '../../components/user/questions/queries';
import { Group } from '../../shared-tools/endpoints-interfaces/groups';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { removePrivacySensitiveUserProps } from '../security-tools/security-tools';
import { __, retryOnError } from './database-manager';
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

/**
 * Converts into a Group object a gremlin query that should return a single group vertex.
 */
export async function queryToGroup(queryOfGroup: process.GraphTraversal): Promise<Group> {
   return gremlinMapToGroup(
      (
         await retryOnError(() =>
            queryOfGroup
               .valueMap()
               .by(__.unfold())
               .next(),
         )
      ).value,
   );
}

export function serializeIfNeeded<T>(value: T): SuportedGremlinTypes {
   const type: string = typeof value;

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
      return JSON.stringify(value);
   }

   return (value as unknown) as SuportedGremlinTypes;
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

/**
 * Converts the format of the Gremlin Map output into a Group object
 */
function gremlinMapToGroup<T extends Map<string, GremlinValueType>>(gremlinMap: T): Group {
   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<string, GremlinValueType> = {
      ...mapToObject(gremlinMap),
   };

   // Deserialize serialized values:
   result.chat = JSON.parse((result.chat as unknown) as string);
   result.dateIdeas = JSON.parse((result.dateIdeas as unknown) as string);
   result.usersThatAccepted = JSON.parse((result.usersThatAccepted as unknown) as string);
   result.feedback = JSON.parse((result.feedback as unknown) as string);

   return (result as unknown) as Group;
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
