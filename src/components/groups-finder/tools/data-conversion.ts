import { fromGremlinMapToObject } from '../../../common-tools/database-tools/data-conversion-tools';
import { retryOnError } from '../../../common-tools/database-tools/database-manager';
import { Traversal, GremlinValueType } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { UserAndItsMatches, UsersToAddToActiveGroups } from '../models';

/**
 * Converts a gremlin query that should return a list of group candidates (groups of users) into the corresponding serialized objects.
 */
export async function fromQueryToGroupCandidates(query: Traversal): Promise<UserAndItsMatches[][]> {
   const resultGremlinOutput = (await retryOnError(() => query.toList())) as Array<
      Array<Map<keyof UserAndItsMatches, string>>
   >;
   return resultGremlinOutput.map(groupAsMap => {
      return groupAsMap.map(g => fromGremlinMapToObject<UserAndItsMatches>(g));
   });
}

/**
 * Converts into a serializer object a gremlin query that should return a list of users with the open groups to be added
 */
export async function fromQueryToUsersToAddInActiveGroups(
   query: Traversal,
): Promise<UsersToAddToActiveGroups[]> {
   const resultGremlinOutput = (await retryOnError(() => query.toList())) as Array<
      Map<keyof UsersToAddToActiveGroups, GremlinValueType>
   >;
   return resultGremlinOutput.map(r => fromGremlinMapToObject<UsersToAddToActiveGroups>(r));
}
