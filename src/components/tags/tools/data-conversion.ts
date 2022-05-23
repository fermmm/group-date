import { valueMap } from "../../../common-tools/database-tools/common-queries";
import { fromGremlinMapToObject } from "../../../common-tools/database-tools/data-conversion-tools";
import { sendQuery } from "../../../common-tools/database-tools/database-manager";
import { GremlinValueType, Traversal } from "../../../common-tools/database-tools/gremlin-typing-tools";
import { Tag } from "../../../shared-tools/endpoints-interfaces/tags";
import { TAG_PROPS_TO_ENCODE_AS_ARRAY } from "../../../shared-tools/validators/tags";

/**
 * Converts into a Tag object a gremlin query that should return a single tag vertex.
 */
export async function fromQueryToTag(queryOfTag: Traversal): Promise<Tag> {
   queryOfTag = valueMap(queryOfTag);
   return fromGremlinMapToTag((await sendQuery(() => queryOfTag.next())).value);
}

/**
 * Converts a gremlin query that should return a list of tags' vertices into a list of Tag objects.
 */
export async function fromQueryToTagList(queryOfTags: Traversal): Promise<Tag[]> {
   queryOfTags = valueMap(queryOfTags);

   const resultGremlinOutput = (await sendQuery(() => queryOfTags.toList())) as Array<
      Map<keyof Tag, GremlinValueType>
   >;

   return resultGremlinOutput.map(tagFromQuery => {
      return fromGremlinMapToTag(tagFromQuery);
   });
}

/**
 * Converts the format of the Gremlin Map output into a Tag object
 */
export function fromGremlinMapToTag(tagFromDatabase: Map<keyof Tag, GremlinValueType>): Tag {
   if (tagFromDatabase == null) {
      return null;
   }

   return fromGremlinMapToObject<Tag>(tagFromDatabase, { propsToDecode: TAG_PROPS_TO_ENCODE_AS_ARRAY });
}
