import 'jest';
import { removeUsers } from '../src/components/common/queries';
import {
   acceptPost,
   addUsersToGroup,
   createGroup,
   getGroupById,
   votePost,
} from '../src/components/groups/models';
import { Group } from '../src/shared-tools/endpoints-interfaces/groups';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers } from './tools/users';

describe('Groups', () => {
   let group: Group;
   let fakeUsers: User[];
   let mainUser: User;
   let mainUser2: User;

   beforeAll(async () => {
      group = await createGroup();
      fakeUsers = await createFakeUsers(10);
      mainUser = fakeUsers[0];
      mainUser2 = fakeUsers[1];
      await addUsersToGroup(fakeUsers, group);
   });

   test('Ideas list gets populated with the ideas from users added to the group', async () => {
      group = await getGroupById(group.groupId, true);
      expect(group.dateIdeas.length === fakeUsers.length).toBe(true);
   });

   test('Users that accept the group are stored correctly', async () => {
      for (const user of fakeUsers) {
         await acceptPost({ token: user.token, groupId: group.groupId }, null);
      }
      group = await getGroupById(group.groupId, true);
      expect(group.usersThatAccepted.length === fakeUsers.length).toBe(true);
   });

   test('Voting dating ideas works correctly and not cheating is allowed', async () => {
      await votePost(
         {
            token: mainUser.token,
            groupId: group.groupId,
            votedIdeasAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
         },
         null,
      );

      // Main user 2 votes for 2 ideas
      await votePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            votedIdeasAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
         },
         null,
      );

      // Main user 2 removed one vote
      await votePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            votedIdeasAuthorsIds: [fakeUsers[4].userId],
         },
         null,
      );

      // Main user 2 votes the same thing 2 times (should have no effect)
      await votePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            votedIdeasAuthorsIds: [fakeUsers[4].userId],
         },
         null,
      );

      group = await getGroupById(group.groupId, true);

      // The idea with index 4 should be voted by mainUser and mainUser2. The idea 3 only by mainUser
      expect(
         group.dateIdeas[4].votersUserId.indexOf(mainUser.userId) !== -1 &&
            group.dateIdeas[4].votersUserId.indexOf(mainUser2.userId) !== -1 &&
            group.dateIdeas[3].votersUserId.indexOf(mainUser.userId) !== -1 &&
            group.dateIdeas[3].votersUserId.length === 1,
      ).toBe(true);
   });

   afterAll(async () => {
      await removeUsers(fakeUsers);
   });
});
