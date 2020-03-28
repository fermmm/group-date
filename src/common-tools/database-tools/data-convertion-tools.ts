import { User, UserPropsValueTypes } from '../../shared-tools/endpoints-interfaces/user';
import { GremlinValueType, SuportedGremlinTypes, UserFromDatabase } from './gremlin-typing-tools';

/**
 * Converts the format of the Gremlin Map output into a User object
 *
 * @param userFromDatabase
 */
export function asUser<T extends User | Partial<User>>(userFromDatabase: UserFromDatabase): T {
   if (userFromDatabase == null) {
      return null;
   }

   // Add general props
   const result: Record<string, GremlinValueType> = {
      ...mapToObject(userFromDatabase.get('profile')),
   };

   // Add questions:
   const questions = mapToObjectDeep(userFromDatabase.get('questions'));
   if (questions?.length > 0) {
      result.questions = questions;
   }

   // Deserialize serialized values:
   if (result.pictures != null) {
      result.pictures = JSON.parse((result.pictures as unknown) as string);
   }

   return (result as unknown) as T;
}

function mapToObject<T>(map: Map<string, T>): Record<string, T> {
   const result: Record<string, T> = {};
   map.forEach((v, k) => {
      result[k] = v;
   });
   return result;
}

function mapToObjectDeep(map: Map<any, any> | Array<Map<any, any>>): any {
   if (map instanceof Array) {
      return map.map(v => mapToObjectDeep(v));
   }

   if (!(map instanceof Map)) {
      return map;
   }

   const result: Record<string, any> = {};
   map.forEach((v, k) => {
      result[k] = mapToObjectDeep(v);
   });

   return result;
}

export function serializeIfNeeded(value: UserPropsValueTypes): SuportedGremlinTypes {
   const type: string = typeof value;

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
      return JSON.stringify(value);
   }

   return value as SuportedGremlinTypes;
}
