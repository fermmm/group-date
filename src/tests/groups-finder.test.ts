import 'jest';
import { User } from '../shared-tools/endpoints-interfaces/user';
import { connectUsersInChain, createMatchingUsers, matchUserWithUsers } from './tools/groups';
import { createFakeUser, createFakeUsers } from './tools/users';
import { queryToGetGroupCandidates } from '../components/groups-finder/queries';
import { GroupQuality, UserAndItsMatches } from '../components/groups-finder/models';
import { fromQueryToGroupCandidates } from '../components/groups-finder/tools/data-conversion';
import { queryToRemoveUsers } from '../components/user/queries';

describe('Group Finder', () => {
   test('Finding matches in order works', async () => {
      // Create a chain group of 3 + 2 fully connected users + 1 single matching user
      const fakeUsers: User[] = await createFakeUsers(3);
      await connectUsersInChain(fakeUsers);
      const moreConnectedUsers: User[] = await createMatchingUsers(2);
      await matchUserWithUsers(moreConnectedUsers[0], fakeUsers);
      await matchUserWithUsers(moreConnectedUsers[1], fakeUsers);
      const singleConnectionUser: User = await createFakeUser();
      await matchUserWithUsers(singleConnectionUser, [moreConnectedUsers[0]]);
      // Create another unrelated group to make sure there is no interference:
      const interferenceGroup: User[] = await createMatchingUsers(5);
      // Get the groups
      const result: UserAndItsMatches[][] = await fromQueryToGroupCandidates(
         queryToGetGroupCandidates(0, GroupQuality.Good),
      );

      expect(result.length).toBeGreaterThan(0);

      // Remove the users added
      await queryToRemoveUsers([...fakeUsers, ...moreConnectedUsers, ...interferenceGroup]);
   });
});
