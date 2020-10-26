import { valueMap } from '../../../common-tools/database-tools/common-queries';
import { fromGremlinMapToObject } from '../../../common-tools/database-tools/data-conversion-tools';
import { sendQuery } from '../../../common-tools/database-tools/database-manager';
import { GremlinValueType, Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { Theme } from '../../../shared-tools/endpoints-interfaces/themes';
import { queryToIncludeExtraInfoInTheme } from '../queries';

/**
 * Converts into a Theme object a gremlin query that should return a single theme vertex.
 */
export async function fromQueryToTheme(
   queryOfTheme: Traversal,
   includeExtraInfo: boolean = false,
): Promise<Theme> {
   if (includeExtraInfo) {
      queryOfTheme = queryToIncludeExtraInfoInTheme(queryOfTheme);
   } else {
      queryOfTheme = valueMap(queryOfTheme);
   }

   return fromGremlinMapToTheme((await sendQuery(() => queryOfTheme.next())).value);
}

/**
 * Converts a gremlin query that should return a list of themes' vertices into a list of Theme objects.
 */
export async function fromQueryToThemeList(
   queryOfThemes: Traversal,
   includeExtraInfo: boolean = false,
): Promise<Theme[]> {
   if (includeExtraInfo) {
      queryOfThemes = queryToIncludeExtraInfoInTheme(queryOfThemes);
   } else {
      queryOfThemes = valueMap(queryOfThemes);
   }

   const resultGremlinOutput = (await sendQuery(() => queryOfThemes.toList())) as Array<
      Map<keyof Theme, GremlinValueType>
   >;

   return resultGremlinOutput.map(themeFromQuery => {
      return fromGremlinMapToTheme(themeFromQuery);
   });
}

/**
 * Converts the format of the Gremlin Map output into a Theme object
 */
export function fromGremlinMapToTheme(themeFromDatabase: Map<keyof Theme, GremlinValueType>): Theme {
   if (themeFromDatabase == null) {
      return null;
   }

   return fromGremlinMapToObject<Theme>(themeFromDatabase);
}
