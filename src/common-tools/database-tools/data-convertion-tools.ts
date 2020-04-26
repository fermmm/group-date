import { process } from 'gremlin';
import { addQuestionsRespondedToUserQuery } from '../../components/user/questions/queries';
import { ChatWithAdmins } from '../../shared-tools/endpoints-interfaces/admin';
import { Group } from '../../shared-tools/endpoints-interfaces/groups';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import {
   removePrivacySensitiveGroupProps,
   removePrivacySensitiveUserProps,
} from '../security-tools/security-tools';
import { valueMap } from './common-queries';
import { __, retryOnError } from './database-manager';
import { GremlinValueType, SupportedGremlinTypes } from './gremlin-typing-tools';

/**
 * Converts into a User object a gremlin query that should return a single user vertex.
 */
export async function queryToUser(
   queryOfUser: process.GraphTraversal,
   includeQuestions: boolean,
): Promise<User> {
   if (includeQuestions) {
      queryOfUser = addQuestionsRespondedToUserQuery(queryOfUser);
   } else {
      queryOfUser = valueMap(queryOfUser);
   }
   return gremlinMapToUser((await retryOnError(() => queryOfUser.next())).value);
}

/**
 * Converts a gremlin query that should return a list of users' vertexes into a list of Users as object.
 */
export async function queryToUserList(
   queryOfUsers: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<User[]> {
   queryOfUsers = addQuestionsRespondedToUserQuery(queryOfUsers);
   const resultGremlinOutput = (await retryOnError(() => queryOfUsers.toList())) as Array<
      Map<keyof User, GremlinValueType>
   >;
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
export async function queryToGroup(
   queryOfGroup: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<Group> {
   return gremlinMapToGroup((await retryOnError(() => queryOfGroup.next())).value, protectPrivacy);
}

/**
 * Converts a gremlin query that should return a list of groups' vertexes into a list of Group as object.
 */
export async function queryToGroupList(
   queryOfGroups: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<Group[]> {
   const resultGremlinOutput = (await retryOnError(() => queryOfGroups.toList())) as Array<
      Map<keyof Group, GremlinValueType>
   >;
   return resultGremlinOutput.map(groupFromQuery => {
      return gremlinMapToGroup(groupFromQuery, protectPrivacy);
   });
}

/**
 * Converts into a Group object a gremlin query that should return a single group vertex.
 */
export async function queryToChatWithAdmins(
   query: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins> {
   return gremlinMapToChatWithAdmins((await retryOnError(() => query.next())).value, protectPrivacy);
}

/**
 * Converts a gremlin query that should return a list of groups' vertexes into a list of Group as object.
 */
export async function queryToChatWithAdminsList(
   query: process.GraphTraversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins[]> {
   const resultGremlinOutput = (await retryOnError(() => query.toList())) as Array<
      Map<keyof ChatWithAdmins, GremlinValueType>
   >;
   return resultGremlinOutput.map(queryElement => {
      return gremlinMapToChatWithAdmins(queryElement, protectPrivacy);
   });
}

/**
 * Converts the format of the Gremlin Map output into a User object
 */
function gremlinMapToUser(userFromDatabase: Map<keyof User, GremlinValueType>): User {
   if (userFromDatabase == null) {
      return null;
   }

   const result = gremlinMapToObject<User>(userFromDatabase, ['pictures']);

   if (result.questions != null) {
      for (const question of result.questions) {
         question.incompatibleAnswers = JSON.parse((question.incompatibleAnswers as unknown) as string);
      }
   }

   return result;
}

/**
 * Converts the format of the Gremlin Map output into a Group object
 */
function gremlinMapToGroup(
   groupFromDatabase: Map<keyof Group, GremlinValueType>,
   protectPrivacy: boolean = true,
): Group {
   if (groupFromDatabase == null) {
      return null;
   }

   // List of members is a list of users so we use the corresponding user converters for that part
   const members = groupFromDatabase.get('members') as Array<Map<keyof User, GremlinValueType>>;
   const membersConverted = members?.map(userFromQuery => {
      if (protectPrivacy) {
         return removePrivacySensitiveUserProps(gremlinMapToUser(userFromQuery));
      }
      return gremlinMapToUser(userFromQuery);
   });
   groupFromDatabase.delete('members');

   // Now the rest of the group properties can be converted
   const group = gremlinMapToObject<Group>(groupFromDatabase, [
      'chat',
      'dateIdeas',
      'dayOptions',
      'usersThatAccepted',
      'feedback',
   ]);

   group.members = membersConverted;

   if (protectPrivacy) {
      return removePrivacySensitiveGroupProps(group);
   } else {
      return group;
   }
}

/**
 * Converts the format of the Gremlin Map output into a ChatWithAdmins object
 */
function gremlinMapToChatWithAdmins(
   chatWithAdmins: Map<keyof ChatWithAdmins, GremlinValueType>,
   protectPrivacy: boolean = true,
): ChatWithAdmins {
   if (chatWithAdmins == null) {
      return null;
   }

   // Convert user prop with the corresponding converter for the users
   let nonAdminUser = gremlinMapToUser(chatWithAdmins.get('nonAdminUser') as Map<keyof User, GremlinValueType>);
   chatWithAdmins.delete('nonAdminUser');
   if (nonAdminUser != null && protectPrivacy) {
      nonAdminUser = removePrivacySensitiveUserProps(nonAdminUser);
   }

   // Now the rest of the properties can be converted
   const result = gremlinMapToObject<ChatWithAdmins>(chatWithAdmins, ['messages']);
   result.nonAdminUser = nonAdminUser;

   return result;
}

/**
 * Converts the format of the Gremlin Map output into JS object
 */
function gremlinMapToObject<T>(gremlinMap: Map<keyof T, GremlinValueType>, propsToParse?: Array<keyof T>): T {
   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<keyof T, GremlinValueType> = mapToObjectDeep(gremlinMap);

   propsToParse?.forEach(propName => {
      if (result[propName] != null) {
         result[propName] = JSON.parse(result[propName] as string);
      }
   });

   return (result as unknown) as T;
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

export function serializeIfNeeded<T>(value: T): SupportedGremlinTypes {
   const type: string = typeof value;

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
      return JSON.stringify(value);
   }

   return (value as unknown) as SupportedGremlinTypes;
}
