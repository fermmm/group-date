import { sendQuery } from "../../../common-tools/database-tools/database-manager";
import { GremlinValueType, Traversal } from "../../../common-tools/database-tools/gremlin-typing-tools";
import {
   removePrivacySensitiveGroupProps,
   removePrivacySensitiveUserProps,
} from "../../../common-tools/security-tools/security-tools";
import { Group } from "../../../shared-tools/endpoints-interfaces/groups";
import { User } from "../../../shared-tools/endpoints-interfaces/user";
import { queryToGetGroupsInFinalFormat } from "../queries";
import { fromGremlinMapToObject } from "../../../common-tools/database-tools/data-conversion-tools";
import { fromGremlinMapToUser } from "../../user/tools/data-conversion";
import {
   GROUP_PROPS_TO_ENCODE_AS_ARRAY,
   GROUP_PROPS_TO_STRINGIFY,
} from "../../../shared-tools/validators/group";

/**
 * Converts a Gremlin query that returns a single group into a Group object.
 *
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 */
export async function fromQueryToGroup(
   queryOfGroup: Traversal,
   protectPrivacy: boolean = true,
   includeFullDetails: boolean = true,
): Promise<Group> {
   return fromGremlinMapToGroup(
      (await sendQuery(() => queryToGetGroupsInFinalFormat(queryOfGroup, includeFullDetails).next())).value,
      protectPrivacy,
   );
}

/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 * @param protectPrivacy If this group object is going to be sent to the client, this should be true.
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 * @returns
 */
export async function fromQueryToGroupList(
   queryOfGroups: Traversal,
   protectPrivacy: boolean = true,
   includeFullDetails: boolean = true,
): Promise<Group[]> {
   const resultGremlinOutput = (await sendQuery(() =>
      queryToGetGroupsInFinalFormat(queryOfGroups, includeFullDetails).toList(),
   )) as Array<Map<keyof Group, GremlinValueType>>;

   return resultGremlinOutput.map(groupFromQuery => {
      return fromGremlinMapToGroup(groupFromQuery, protectPrivacy);
   });
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
   const members = groupFromDatabase.get("members") as Array<Map<keyof User, GremlinValueType>>;
   const membersConverted = members?.map(userFromQuery => {
      if (protectPrivacy) {
         return removePrivacySensitiveUserProps(fromGremlinMapToUser(userFromQuery));
      }
      return fromGremlinMapToUser(userFromQuery);
   });
   groupFromDatabase.delete("members");

   // Now the rest of the group properties can be converted
   const group = fromGremlinMapToObject<Group>(groupFromDatabase, {
      serializedPropsToParse: GROUP_PROPS_TO_STRINGIFY,
      propsToDecode: GROUP_PROPS_TO_ENCODE_AS_ARRAY,
   });

   group.members = membersConverted;

   if (protectPrivacy) {
      return removePrivacySensitiveGroupProps(group);
   } else {
      return group;
   }
}
