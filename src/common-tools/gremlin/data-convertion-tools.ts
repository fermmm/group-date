import { User } from '../../components/user/models';

/**
 * Converts the format of the Gremlin output into a User object
 *
 * @param userMap The Map<string, string[]> object returned by Gremlin database when using valueMap(true).next() in the query
 */
export function asUser(userMap: Map<string, string[]>): Partial<User> {
   if (userMap == null) {
      return null;
   }

   const result: Partial<User> = {};
   for (const userKey of userMap.keys()) {
      const keyAsString: string = userKey.toString();
      if (keyAsString === 'label') {
         continue;
      }

      const value: number | string | string[] = userMap.get(userKey);
      if (value.length && value.length === 1) {
         result[keyAsString] = value[0];
         continue;
      }
      result[keyAsString] = value;
   }

   return result;
}

/**
 * Converts the format of the Gremlin output into User objects when requesting a list of Users
 *
 * @param userMap The Array<Map<string, string[]>> object returned by Gremlin database when using valueMap(true).toList() in the query
 */
export function asUserList(userMapList: Array<Map<string, string[]>>): Array<Partial<User>> {
   if (userMapList == null) {
      return null;
   }

   const result: Array<Partial<User>> = [];

   for (const user of userMapList) {
      result.push(asUser(user));
   }

   return result;
}
