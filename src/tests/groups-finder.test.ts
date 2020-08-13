import 'jest';
import { fromQueryToUserList } from '../common-tools/database-tools/data-conversion-tools';
import { User } from '../shared-tools/endpoints-interfaces/user';
import { connectUsersInChain, createMatchingUsers, matchUserWithUsers } from './tools/groups';
import { createFakeUser, createFakeUsers } from './tools/users';

describe('Group Finder', () => {
   // test('Finding matches in order works', async () => {
   //    // Create a chain group of 3 + 2 fully connected users + 1 single matching user
   //    const fakeUsers: User[] = await createFakeUsers(3);
   //    await connectUsersInChain(fakeUsers);
   //    const moreConnectedUsers: User[] = await createMatchingUsers(2);
   //    await matchUserWithUsers(moreConnectedUsers[0], fakeUsers);
   //    await matchUserWithUsers(moreConnectedUsers[1], fakeUsers);
   //    const singleConnectionUser: User = await createFakeUser();
   //    await matchUserWithUsers(singleConnectionUser, [moreConnectedUsers[0]]);
   //    // Create another unrelated group to make sure there is no interference:
   //    const interferenceGroup: User[] = await createMatchingUsers(5);
   //    // Get the matches and test the order
   //    const result: User[] = await queryToUserList(
   //       getMatchesOrderedByConnectionsAmount(getUserTraversalById(moreConnectedUsers[0].userId))
   //          .select('matches')
   //          .unfold(),
   //    );
   //    expect(
   //       result[0].userId === moreConnectedUsers[1].userId || result[0].userId === fakeUsers[1].userId,
   //    ).toBe(true);
   //    expect(
   //       result[1].userId === moreConnectedUsers[1].userId || result[1].userId === fakeUsers[1].userId,
   //    ).toBe(true);
   //    expect(result[result.length - 1].userId).toBe(singleConnectionUser.userId);
   //    // Remove the users added
   //    await removeUsers([...fakeUsers, ...moreConnectedUsers, ...interferenceGroup]);
   // });
});
