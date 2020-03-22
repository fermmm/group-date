import { User } from '../../shared-tools/endpoints-interfaces/user';
import { UserFromDatabase } from './gremlin-typing-tools';

/**
 * Converts the format of the Gremlin Map output into a User object
 *
 * @param userFromDatabase
 */
export function asUser(userFromDatabase: UserFromDatabase): Partial<User> {
   if (userFromDatabase == null) {
      return null;
   }

   // Add general props
   const result: Partial<User> = {
      ...mapToObject(userFromDatabase.get('profile')),
   };

   // Add questions:
   const questions: typeof result.questions = mapToObjectDeep(userFromDatabase.get('questions'));
   if (questions?.length > 0) {
      result.questions = questions;
   }

   // Deserialize serialized values:
   if (result.pictures != null) {
      result.pictures = JSON.parse((result.pictures as unknown) as string);
   }

   return result;
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

export function serializeIfNeeded(value: number | string | boolean | string[]): number | string | boolean {
   const type: string = typeof value;

   if (type !== 'string' && type !== 'boolean' && type !== 'number') {
      return JSON.stringify(value);
   }

   return value as number | string | boolean;
}
