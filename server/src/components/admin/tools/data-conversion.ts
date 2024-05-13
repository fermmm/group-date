import { fromGremlinMapToObject } from "../../../common-tools/database-tools/data-conversion-tools";
import { sendQuery } from "../../../common-tools/database-tools/database-manager";
import { Traversal, GremlinValueType } from "../../../common-tools/database-tools/gremlin-typing-tools";
import { removePrivacySensitiveUserProps } from "../../../common-tools/security-tools/security-tools";
import { ChatWithAdmins } from "../../../shared-tools/endpoints-interfaces/admin";
import { User } from "../../../shared-tools/endpoints-interfaces/user";
import { fromGremlinMapToUser } from "../../user/tools/data-conversion";

/**
 * Converts into a Group object a gremlin query that should return a single group vertex.
 */
export async function fromQueryToChatWithAdmins(
   query: Traversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins> {
   return fromGremlinMapToChatWithAdmins((await sendQuery(() => query.next())).value, protectPrivacy);
}

/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 */
export async function fromQueryToChatWithAdminsList(
   query: Traversal,
   protectPrivacy: boolean = true,
): Promise<ChatWithAdmins[]> {
   const resultGremlinOutput = (await sendQuery(() => query.toList())) as Array<
      Map<keyof ChatWithAdmins, GremlinValueType>
   >;
   return resultGremlinOutput.map(queryElement => {
      return fromGremlinMapToChatWithAdmins(queryElement, protectPrivacy);
   });
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
      chatWithAdmins.get("nonAdminUser") as Map<keyof User, GremlinValueType>,
   );
   chatWithAdmins.delete("nonAdminUser");
   if (nonAdminUser != null && protectPrivacy) {
      nonAdminUser = removePrivacySensitiveUserProps(nonAdminUser);
   }

   // Now the rest of the properties can be converted
   const result = fromGremlinMapToObject<ChatWithAdmins>(chatWithAdmins, {
      serializedPropsToParse: ["messages"],
      // TODO: Make an array on their own file along with validation, currently this is not used so there is no validation but when it starts being used we should have a validator
      propsToDecode: ["messages"],
   });
   result.nonAdminUser = nonAdminUser;

   return result;
}
