import { searchAndCreateNewGroups } from '../../../components/groups-finder/models';
import { GroupCandidate, UserWithMatches } from '../../../components/groups-finder/tools/types';
import { userGroupsGet } from '../../../components/groups/models';
import { setAttractionPost } from '../../../components/user/models';
import { Group } from '../../../shared-tools/endpoints-interfaces/groups';
import { User, AttractionType } from '../../../shared-tools/endpoints-interfaces/user';
import { fakeCtx } from '../replacements';
import { createFakeUser } from '../users';

export async function createUsersFromGroupCandidate(group: GroupCandidate): Promise<User[]> {
   const usersCreated: User[] = [];

   // Create the users
   for (const user of group) {
      // We set the userId and token to the same string for easy access in the future
      usersCreated.push(await createFakeUser({ userId: user.userId, token: user.userId }));
   }

   // Once all users are created we can connect the users
   for (const user of group) {
      await setAttractionPost(
         {
            token: user.userId,
            attractions: user.matches.map(userId => ({ userId, attractionType: AttractionType.Like })),
         },
         fakeCtx,
      );
   }

   return usersCreated;
}

export async function callGroupSearchMultipleTimes(): Promise<void> {
   for (let i = 0; i < 3; i++) {
      await searchAndCreateNewGroups();
   }
}

export async function getGroupsOfGroupCandidateMembers(
   groupCandidateUsers: UserWithMatches[],
): Promise<Group[]> {
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
