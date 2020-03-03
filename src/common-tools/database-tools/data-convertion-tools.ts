import { User } from '../endpoints-interfaces/user';
import { UserFromDatabase } from './gremlin-typing-tools';

/**
 * Converts the format of the Gremlin output into a User object
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
