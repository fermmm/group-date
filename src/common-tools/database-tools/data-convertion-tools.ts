import { User } from '../endpoints-interfaces/user';
import { UserFromDatabase } from './gremlin-typing-tools';

/**
 * Converts the format of the Gremlin output into a User object
 *
 * @param userMap The Map<string, string[]> object returned by Gremlin database when using valueMap(true).next() in the query
 */
export function asUser(userMap: UserFromDatabase): Partial<User> {
   if (userMap == null) {
      return null;
   }

   const result: Partial<User> = {
      ...mapToObject(userMap.get('profile')),
      questions: mapToObjectDeep(userMap.get('questions')),
   };

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
   if(map instanceof Array) {
      return map.map((v) => mapToObjectDeep(v));
   }

   if(!(map instanceof Map)) {
      return map;
   }
   
   const result: Record<string, any> = {};
   map.forEach((v, k) => {
      result[k] = mapToObjectDeep(v);
   });

   return result;
}