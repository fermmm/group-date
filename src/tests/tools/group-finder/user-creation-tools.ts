import { searchAndCreateNewGroups } from '../../../components/groups-finder/models';
import { GroupCandidate, UserWithMatches } from '../../../components/groups-finder/tools/types';
import { userGroupsGet } from '../../../components/groups/models';
import { setAttractionPost } from '../../../components/user/models';
import { Group } from '../../../shared-tools/endpoints-interfaces/groups';
import { User, AttractionType } from '../../../shared-tools/endpoints-interfaces/user';
import { fakeCtx } from '../replacements';
import { createFakeUser } from '../users';

/**
 * Converts group candidate users into full users connected between them with a Match as they
 * are connected in the group candidate.
 */
export async function createFullUsersFromGroupCandidate(group: GroupCandidate): Promise<User[]> {
   const usersCreated: User[] = [];

   // Create the users
   for (const user of group.users) {
      // We set the userId and token to the same string for easy access in the future
      usersCreated.push(await createFakeUser({ userId: user.userId, token: user.userId }));
   }

   console.time('setAttractionPost');
   // Once all users are created we can connect the users
   for (const user of group.users) {
      await setAttractionPost(
         {
            token: user.userId,
            attractions: user.matches.map(userId => ({ userId, attractionType: AttractionType.Like })),
         },
         fakeCtx,
      );
   }
   console.timeEnd('setAttractionPost');

   return usersCreated;
}

export async function callGroupCreationMultipleTimes(): Promise<void> {
   for (let i = 0; i < 3; i++) {
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
