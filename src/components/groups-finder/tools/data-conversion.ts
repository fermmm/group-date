import { fromGremlinMapToObject } from '../../../common-tools/database-tools/data-conversion-tools';
import { sendQuery } from '../../../common-tools/database-tools/database-manager';
import { Traversal, GremlinValueType } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { GroupCandidate, UserWithMatches, GroupsReceivingNewUsers } from './types';
import { generateId } from '../../../common-tools/string-tools/string-tools';
import { reportPossibleDataCorruption } from './group-candidate-analysis';

/**
 * Converts a gremlin query that should return a list of group candidates (groups of users) into the corresponding serialized objects.
 */
export async function fromQueryToGroupCandidates(query: Traversal): Promise<GroupCandidate[]> {
   const resultGremlinOutput = (await query.toList()) as Array<Array<Map<keyof UserWithMatches, string>>>;
   const result: GroupCandidate[] = resultGremlinOutput.map(groupAsMap => {
      return { groupId: generateId(), users: groupAsMap.map(g => fromGremlinMapToObject<UserWithMatches>(g)) };
   });
   reportPossibleDataCorruption(result);
   return result;
}

/**
 * Converts into a serializer object a gremlin query that returns groups that can receive new users
 */
export async function fromQueryToGroupsReceivingNewUsers(query: Traversal): Promise<GroupsReceivingNewUsers[]> {
   const resultGremlinOutput = (await query.toList()) as Array<
      Map<keyof GroupsReceivingNewUsers, GremlinValueType>
   >;
   return resultGremlinOutput.map(r => fromGremlinMapToObject<GroupsReceivingNewUsers>(r));
}
