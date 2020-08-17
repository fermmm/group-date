import { UserAndItsMatches } from '../../components/groups-finder/models';
import { queryToGetGroupsInFinalFormat } from '../../components/groups/queries';
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
import { GremlinValueType, SupportedGremlinTypes, Traversal } from './gremlin-typing-tools';

/**
 * Converts into a User object a gremlin query that should return a single user vertex.
 */
/**
 *
 * @param queryOfUser
 * @param includeQuestions
 */
export async function fromQueryToUser(queryOfUser: Traversal, includeQuestions: boolean): Promise<User> {
   if (includeQuestions) {
      queryOfUser = addQuestionsRespondedToUserQuery(queryOfUser);
   } else {
      queryOfUser = valueMap(queryOfUser);
   }
   return fromGremlinMapToUser((await retryOnError(() => queryOfUser.next())).value);
}

/**
 * Converts a gremlin query that should return a list of users' vertices into a list of Users as object.
 *
 * @param protectPrivacy Don't include internal properties like token and other credentials. default = true
 * @param includeQuestionsData default = true
 */
export async function fromQueryToUserList(
   queryOfUsers: Traversal,
   protectPrivacy: boolean = true,
   includeQuestionsData: boolean = true,
): Promise<User[]> {
   if (includeQuestionsData) {
      queryOfUsers = addQuestionsRespondedToUserQuery(queryOfUsers);
   } else {
      queryOfUsers = valueMap(queryOfUsers);
   }
   const resultGremlinOutput = (await retryOnError(() => queryOfUsers.toList())) as Array<
      Map<keyof User, GremlinValueType>
   >;
   return resultGremlinOutput.map(userFromQuery => {
      if (protectPrivacy) {
         return removePrivacySensitiveUserProps(fromGremlinMapToUser(userFromQuery));
      }
      return fromGremlinMapToUser(userFromQuery);
   });
}

/**
 * Converts a Gremlin query that returns a single group into a Group object.
 */
export async function fromQueryToGroup(
   queryOfGroup: Traversal,
   protectPrivacy: boolean = true,
   includeFullDetails: boolean = true,
): Promise<Group> {
   return fromGremlinMapToGroup(
      (await retryOnError(() => queryToGetGroupsInFinalFormat(queryOfGroup, includeFullDetails).next())).value,
      protectPrivacy,
   );
}

/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 */
export async function fromQueryToGroupList(
   queryOfGroups: Traversal,
   protectPrivacy: boolean = true,
   includeFullDetails: boolean = true,
): Promise<Group[]> {
   const resultGremlinOutput = (await retryOnError(() =>
      queryToGetGroupsInFinalFormat(queryOfGroups, includeFullDetails).toList(),
   )) as Array<Map<keyof Group, GremlinValueType>>;

   return resultGremlinOutput.map(groupFromQuery => {
      return fromGremlinMapToGroup(groupFromQuery, protectPrivacy);
   });
}

/**
 * Converts into a Group object a gremlin query that should return a single group vertex.
 */
export async function fromQueryToChatWithAdmins(
   query: Traversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins> {
   return fromGremlinMapToChatWithAdmins((await retryOnError(() => query.next())).value, protectPrivacy);
}

/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 */
export async function fromQueryToChatWithAdminsList(
   query: Traversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins[]> {
   const resultGremlinOutput = (await retryOnError(() => query.toList())) as Array<
      Map<keyof ChatWithAdmins, GremlinValueType>
   >;
   return resultGremlinOutput.map(queryElement => {
      return fromGremlinMapToChatWithAdmins(queryElement, protectPrivacy);
   });
}

/**
 * Converts a gremlin query that should return a list of group candidates (groups of users) into the corresponding serialized objects.
 */
export async function fromQueryToGroupCandidate(query: Traversal): Promise<UserAndItsMatches[][]> {
   const resultGremlinOutput = (await retryOnError(() => query.toList())) as Array<
      Array<Map<keyof UserAndItsMatches, string>>
   >;
   return resultGremlinOutput.map(groupAsMap => {
      return groupAsMap.map(g => fromGremlinMapToObject<UserAndItsMatches>(g));
   });
}

/**
 * Converts the format of the Gremlin Map output into a User object
 */
function fromGremlinMapToUser(userFromDatabase: Map<keyof User, GremlinValueType>): User {
   if (userFromDatabase == null) {
      return null;
   }

   const result = fromGremlinMapToObject<User>(userFromDatabase, ['pictures', 'notifications']);

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
function fromGremlinMapToGroup(
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
         return removePrivacySensitiveUserProps(fromGremlinMapToUser(userFromQuery));
      }
      return fromGremlinMapToUser(userFromQuery);
   });
   groupFromDatabase.delete('members');

   // Now the rest of the group properties can be converted
   const group = fromGremlinMapToObject<Group>(groupFromDatabase, [
      'chat',
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
function fromGremlinMapToChatWithAdmins(
   chatWithAdmins: Map<keyof ChatWithAdmins, GremlinValueType>,
   protectPrivacy: boolean = true,
): ChatWithAdmins {
   if (chatWithAdmins == null) {
      return null;
   }

   // Convert user prop with the corresponding converter for the users
   let nonAdminUser = fromGremlinMapToUser(
      chatWithAdmins.get('nonAdminUser') as Map<keyof User, GremlinValueType>,
   );
   chatWithAdmins.delete('nonAdminUser');
   if (nonAdminUser != null && protectPrivacy) {
      nonAdminUser = removePrivacySensitiveUserProps(nonAdminUser);
   }

   // Now the rest of the properties can be converted
   const result = fromGremlinMapToObject<ChatWithAdmins>(chatWithAdmins, ['messages']);
   result.nonAdminUser = nonAdminUser;

   return result;
}

/**
 * Converts the format of the Gremlin Map output into JS object
 */
function fromGremlinMapToObject<T>(
   gremlinMap: Map<keyof T, GremlinValueType>,
   propsToParse?: Array<keyof T>,
): T {
   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<keyof T, GremlinValueType> = fromMapToObjectDeep(gremlinMap);

   propsToParse?.forEach(propName => {
      if (result[propName] != null) {
         result[propName] = JSON.parse(result[propName] as string);
      }
   });

   return (result as unknown) as T;
}

function fromMapToObjectDeep(map: Map<any, any> | Array<Map<any, any>>): any {
   if (map instanceof Array) {
      return map.map(v => fromMapToObjectDeep(v));
   }

   if (!(map instanceof Map)) {
      return map;
   }

   const result: Record<string, any> = {};
   map.forEach((v, k) => {
      result[k] = fromMapToObjectDeep(v);
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
