import { Group } from "../../shared-tools/endpoints-interfaces/groups";
import { Tag } from "../../shared-tools/endpoints-interfaces/tags";
import { decodeString } from "../../shared-tools/utility-functions/decodeString";
import { encodeString } from "../../shared-tools/utility-functions/encodeString";
import { GROUP_PROPS_TO_ENCODE } from "../../shared-tools/validators/group";
import { TAG_PROPS_TO_ENCODE } from "../../shared-tools/validators/tags";
import { EditableUserPropKey, USER_PROPS_TO_ENCODE } from "../../shared-tools/validators/user";
import { sendQuery, __ } from "./database-manager";
import { GremlinValueType, SupportedGremlinTypes, Traversal } from "./gremlin-typing-tools";

/**
 * Converts the format of the Gremlin Map output into JS object
 * @param options If a prop was serialized or parsed you need to include it here in order to be restored
 */
export function fromGremlinMapToObject<T>(
   gremlinMap: Map<keyof T, GremlinValueType>,
   options?: FromGremlinMapToObjectOptions<T>,
): T {
   const { serializedPropsToParse, propsToDecode } = options ?? {};

   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<keyof T, GremlinValueType> = fromMapToObjectDeep(gremlinMap);

   propsToDecode?.forEach(propName => {
      if (result[propName] != null) {
         result[propName] = decodeString(result[propName] as string);
      }
   });

   serializedPropsToParse?.forEach(propName => {
      if (result[propName] != null) {
         result[propName] = JSON.parse(result[propName] as string);
      }
   });

   return result as unknown as T;
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

   if (type === "string" || type === "number" || type === "boolean") {
      return value as unknown as SupportedGremlinTypes;
   }

   return JSON.stringify(value);
}

export function serializeAllValuesIfNeeded<T>(object: T): Record<keyof T, GremlinValueType> {
   const result: Record<keyof T, GremlinValueType> = {} as Record<keyof T, GremlinValueType>;
   Object.keys(object).forEach(key => {
      result[key] = serializeIfNeeded(object[key]);
   });
   return result;
}

export function encodeIfNeeded<T>(value: T, valueName: string, vertex: "user" | "group" | "tag" | "admin"): T {
   const type: string = typeof value;

   // Here we are only continuing with string values but typescript does not realize, that is why typescript needs to be disabled later
   if (type !== "string") {
      return value;
   }

   if (vertex === "user") {
      if (USER_PROPS_TO_ENCODE.has(valueName as EditableUserPropKey)) {
         //@ts-ignore
         return encodeString(value as string) as T;
      } else {
         return value;
      }
   }

   if (vertex === "tag") {
      if (TAG_PROPS_TO_ENCODE.has(valueName as keyof Tag)) {
         //@ts-ignore
         return encodeString(value as string) as T;
      } else {
         return value;
      }
   }

   if (vertex === "group") {
      if (GROUP_PROPS_TO_ENCODE.has(valueName as keyof Group)) {
         //@ts-ignore
         return encodeString(value as string) as T;
      } else {
         return value;
      }
   }

   return value;
}

/**
 * Takes a traversal that returns a single vertex or edge, extracts the desired props
 * from it and return them as a parsed object. Useful for optimization to not retrieve a full object from
 * the database.
 * You have to pass a type for the object returned, for example: if you want name and age of a user the
 * type is {name: string, age:number} or Pick<User, "name" | "age">
 *
 * @param options If there is any prop to decode from string or to parse use this options object
 */
export async function fromQueryToSpecificProps<T>(
   query: Traversal,
   propsToExtract: string[],
   options?: FromGremlinMapToObjectOptions<T>,
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
      options,
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

interface FromGremlinMapToObjectOptions<T> {
   /**
    * If a prop was serialized from an object to a string you need to include it here in order to be parsed back to object
    */
   serializedPropsToParse?: Array<keyof T>;

   /**
    * If a prop was encoded using the encodeString() function you need to include it here in order to be decoded back to normal string
    */
   propsToDecode?: Array<keyof T>;
}
