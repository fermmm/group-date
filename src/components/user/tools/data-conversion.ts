import { valueMap } from '../../../common-tools/database-tools/common-queries';
import { fromGremlinMapToObject } from '../../../common-tools/database-tools/data-conversion-tools';
import { retryOnError } from '../../../common-tools/database-tools/database-manager';
import { GremlinValueType, Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { removePrivacySensitiveUserProps } from '../../../common-tools/security-tools/security-tools';
import { User } from '../../../shared-tools/endpoints-interfaces/user';
import { addQuestionsRespondedToUserQuery } from '../questions/queries';

/**
 * Converts into a User object a gremlin query that should return a single user vertex.
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
 * Converts the format of the Gremlin Map output into a User object
 */
export function fromGremlinMapToUser(userFromDatabase: Map<keyof User, GremlinValueType>): User {
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
