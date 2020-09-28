import { __ } from './database-manager';
import { GremlinValueType, SupportedGremlinTypes } from './gremlin-typing-tools';

/**
 * Converts the format of the Gremlin Map output into JS object
 */
export function fromGremlinMapToObject<T>(
   gremlinMap: Map<keyof T, GremlinValueType>,
   propsToParse?: Array<keyof T>,
): T {
   if (gremlinMap == null) {
      return null;
   }

   // Add general props
   const result: Record<keyof T, GremlinValueType> = fromMapToObjectDeep(gremlinMap);

   propsToParse?.forEach(propName => {
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

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
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
