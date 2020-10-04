import { executePromises } from '../../../common-tools/js-tools/js-tools';
import { searchAndCreateNewGroups } from '../../../components/groups-finder/models';
import { GroupCandidate, UserWithMatches } from '../../../components/groups-finder/tools/types';
import { userGroupsGet } from '../../../components/groups/models';
import { setAttractionPost } from '../../../components/user/models';
import { Group } from '../../../shared-tools/endpoints-interfaces/groups';
import { User, AttractionType } from '../../../shared-tools/endpoints-interfaces/user';
import { fakeCtx } from '../replacements';
import { createFakeUser } from '../users';
import { createFakeUser2 } from '../_experimental';

/**
 * Converts group candidate users into full users connected between them as they
 * are connected in the group candidate.
 */
export async function createFullUsersFromGroupCandidate(group: GroupCandidate): Promise<User[]> {
   const usersCreated: User[] = [];
   const creationPromises = group.users.map(u => async () =>
      usersCreated.push(await createFakeUser2({ userId: u.userId, token: u.userId })),
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

   await executePromises(creationPromises, true);
   await executePromises(attractionPromises, true);

   return usersCreated;
}

export async function callGroupCreationMultipleTimes(times: number = 3): Promise<void> {
   for (let i = 0; i < times; i++) {
      await searchAndCreateNewGroups();
   }
}

/**
 * Gets the final groups created with users from a group candidate.
 */
export async function retrieveFinalGroupsOf(groupCandidateUsers: UserWithMatches[]): Promise<Group[]> {
   const result: Group[] = [];
   for (const user of groupCandidateUsers) {
      // userId and token are the same in these tests
      const userGroups = await userGroupsGet({ token: user.userId }, fakeCtx);
      userGroups.forEach(userGroup => {
         if (result.find(g => g.groupId === userGroup.groupId) == null) {
            result.push(userGroup);
         }
      });
   }
   return result;
}
