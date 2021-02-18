import { sendQuery, __ } from "./database-manager";
import { GremlinValueType, SupportedGremlinTypes, Traversal } from "./gremlin-typing-tools";

/**
 * Converts the format of the Gremlin Map output into JS object
 * @param serializedPropsToParse If a prop was serialized you need to include it here in order to be parsed
 */
export function fromGremlinMapToObject<T>(
   gremlinMap: Map<keyof T, GremlinValueType>,
   serializedPropsToParse?: Array<keyof T>,
): T {
   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<keyof T, GremlinValueType> = fromMapToObjectDeep(gremlinMap);

   serializedPropsToParse?.forEach(propName => {
      if (result[propName] != null) {
         result[propName] = JSON.parse(result[propName] as string);
      }
   });

   return (result as unknown) as T;
}

export function fromMapToObjectDeep(map: Map<any, any> | Array<Map<any, any>>): any {
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

   if (type !== "string" && type !== "boolean" && type !== "number") {
      return JSON.stringify(value);
   }

   return (value as unknown) as SupportedGremlinTypes;
}

export function serializeAllValuesIfNeeded<T>(object: T): Record<keyof T, GremlinValueType> {
   const result: Record<keyof T, GremlinValueType> = {} as Record<keyof T, GremlinValueType>;
   Object.keys(object).forEach(key => {
      result[key] = serializeIfNeeded(object[key]);
   });
   return result;
}

/**
 * Takes a traversal that returns a single vertex or edge, extracts the desired props
 * from it and return them as a parsed object. Useful for optimization to not retrieve a full object from
 * the database.
 * You have to pass a type for the object returned, for example: if you want name and age of a user the
 * type is {name: string, age:number} or Pick<User, "name" | "age">
 *
 * @param serializedPropsToParse If there is any prop to extract that needs to be parsed add it here
 */
export async function fromQueryToSpecificProps<T>(
   query: Traversal,
   propsToExtract: string[],
   serializedPropsToParse?: Array<keyof T>,
): Promise<T> {
   return fromGremlinMapToObject<T>(
      (
         await sendQuery(() =>
            query
               .valueMap(...propsToExtract)
               .by(__.unfold())
               .next(),
         )
      )?.value,
      serializedPropsToParse,
   );
}

/**
 * Takes a traversal that returns a single vertex or edge, extracts the value from a specified prop
 * and returns is parsed. Useful for optimization to not retrieve a full object from the database.
 * You have to pass a type for the object returned.
 */
export async function fromQueryToSpecificPropValue<T>(query: Traversal, propToGetValue: string): Promise<T> {
   return (await sendQuery(() => query.values(propToGetValue).next()))?.value;
}
