import { executePromises } from "../../../common-tools/js-tools/js-tools";
import { searchAndCreateNewGroups } from "../../../components/groups-finder/models";
import { GroupCandidate } from "../../../components/groups-finder/tools/types";
import { userGroupsGet } from "../../../components/groups/models";
import { setAttractionPost } from "../../../components/user/models";
import { Group, Slot, UserWithMatches } from "../../../shared-tools/endpoints-interfaces/groups";
import { User, AttractionType } from "../../../shared-tools/endpoints-interfaces/user";
import { fakeCtx } from "../replacements";
import { createFakeUser2 } from "../_experimental";
import { GROUP_SLOTS_CONFIGS, MAX_GROUP_SIZE } from "../../../configurations";

const testGroupsCreated: Group[] = [];

/**
 * Converts group candidate users into full users connected between them as they
 * are connected in the group candidate.
 *
 * @param useMultithreading When this is true users are created without checking for duplication be aware of that
 */
export async function createFullUsersFromGroupCandidate(
   group: GroupCandidate,
   useMultithreading: boolean = false,
): Promise<User[]> {
   const usersCreated: User[] = [];
   const creationPromises = group.users.map(u => async () =>
      usersCreated.push(await createFakeUser2({ userId: u.userId, token: u.userId }, useMultithreading)),
   );

   // Once all users are created we can connect the users
   const attractionPromises = group.users.map(user => async () =>
      await setAttractionPost(
         {
            token: user.userId,
            attractions: user.matches.map(userId => ({ userId, attractionType: AttractionType.Like })),
         },
         fakeCtx,
      ),
   );

   await executePromises(creationPromises, useMultithreading);
   // This is not thread safe in any DB for the moment
   await executePromises(attractionPromises, false);

   return usersCreated;
}

export async function callGroupFinder(times: number = 3): Promise<Group[]> {
   let groupsCreated: Group[] = [];
   for (let i = 0; i < times; i++) {
      groupsCreated = [...groupsCreated, ...(await searchAndCreateNewGroups())];
   }
   testGroupsCreated.push(...groupsCreated);
   return groupsCreated;
}

/**
 * Gets the final groups created with users from a group candidate or a string list with ids.
 */
export async function retrieveFinalGroupsOf(
   groupCandidateUsers: UserWithMatches[] | string[],
): Promise<Group[]> {
   const result: Group[] = [];
   for (const user of groupCandidateUsers) {
      const token: string = typeof user === "string" ? user : user.userId;

      // userId and token are the same in these tests
      const userGroups = await userGroupsGet({ token }, fakeCtx);
      userGroups.forEach(userGroup => {
         if (result.find(g => g.groupId === userGroup.groupId) == null) {
            result.push(userGroup);
         }
      });
   }
   return result;
}

export function getAllTestGroupsCreated(): Group[] {
   return testGroupsCreated;
}

export function getSmallerSlot(): Slot {
   return GROUP_SLOTS_CONFIGS.reduce((previous, current) => {
      if (current.maximumSize ?? MAX_GROUP_SIZE < previous.maximumSize ?? MAX_GROUP_SIZE) {
         return current;
      }
      return previous;
   }, GROUP_SLOTS_CONFIGS[0]);
}
