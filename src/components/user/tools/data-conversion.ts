import { valueMap } from "../../../common-tools/database-tools/common-queries";
import { fromGremlinMapToObject } from "../../../common-tools/database-tools/data-conversion-tools";
import { sendQuery } from "../../../common-tools/database-tools/database-manager";
import { GremlinValueType, Traversal } from "../../../common-tools/database-tools/gremlin-typing-tools";
import { removePrivacySensitiveUserProps } from "../../../common-tools/security-tools/security-tools";
import { User } from "../../../shared-tools/endpoints-interfaces/user";
import { queryToIncludeFullInfoInUserQuery } from "../queries";

/**
 * Converts into a User object a gremlin query that should return a single user vertex.
 * @param includeFullInfo Includes tags data
 */
export async function fromQueryToUser(queryOfUser: Traversal, includeFullInfo: boolean): Promise<User> {
   if (includeFullInfo) {
      queryOfUser = queryToIncludeFullInfoInUserQuery(queryOfUser);
   } else {
      queryOfUser = valueMap(queryOfUser);
   }
   return fromGremlinMapToUser((await sendQuery(() => queryOfUser.next())).value);
}

/**
 * Converts a gremlin query that should return a list of users' vertices into a list of Users as object.
 *
 * @param protectPrivacy Don't include internal properties like token and other credentials. default = true
 * @param includeFullInfo default = true Includes questions and tags data
 */
export async function fromQueryToUserList(
   queryOfUsers: Traversal,
   protectPrivacy: boolean = true,
   includeFullInfo: boolean = true,
): Promise<User[]> {
   if (includeFullInfo) {
      queryOfUsers = queryToIncludeFullInfoInUserQuery(queryOfUsers);
   } else {
      queryOfUsers = valueMap(queryOfUsers);
   }
   const resultGremlinOutput = (await sendQuery(() => queryOfUsers.toList())) as Array<
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

   const result = fromGremlinMapToObject<User>(userFromDatabase, [
      "images",
      "notifications",
      "questionsShowed",
      "genders",
      "likesGenders",
      "banReasons",
      "requiredTasks",
   ]);

   return result;
}
