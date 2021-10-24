import "jest";
import { firstBy } from "thenby";
import { DeepPartial } from "ts-essentials";
import { objectsContentIsEqual } from "../../common-tools/js-tools/js-tools";
import { User } from "../../shared-tools/endpoints-interfaces/user";

/**
 * Checks if the users created contains the information that was passed to create them. Also checks that both
 * arrays have the same size, so no user is missing.
 */
export function createdUsersMatchesFakeData(
   createdUsers: User[],
   dataUsed: Array<DeepPartial<User>>,
   alsoCheckOrder: boolean = false,
): void {
   expect(createdUsers).toHaveLength(dataUsed.length);

   if (!alsoCheckOrder) {
      createdUsers = [...createdUsers];
      dataUsed = [...dataUsed];
      const cmp = new Intl.Collator().compare;
      createdUsers.sort(
         firstBy<User>("userId", { cmp }),
      );
      dataUsed.sort(
         firstBy<User>("userId", { cmp }),
      );
   }

   for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const userData = dataUsed[i];
      expect(usersDataMatches(user, userData)).toBeTrue();
   }
}

export function usersDataMatches(user1: DeepPartial<User>, user2: DeepPartial<User>): boolean {
   return objectsContentIsEqual(user1, user2);
}
