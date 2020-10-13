import 'jest';
import * as JestDateMock from 'jest-date-mock';
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
   getAllTestGroupsCreated,
   retrieveFinalGroupsOf,
} from './tools/group-finder/user-creation-tools';
import * as GroupCandTestTools from './tools/group-finder/group-candidate-test-editing';
import {
   GROUP_SLOTS_CONFIGS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
} from '../configurations';
import { Group } from '../shared-tools/endpoints-interfaces/groups';
import { getBiggestGroup } from './tools/groups';
import { hoursToMilliseconds } from '../common-tools/math-tools/general';
import { GroupCandidate } from '../components/groups-finder/tools/types';
import { queryToRemoveGroups } from '../components/groups/queries';
import { queryToRemoveUsers } from '../components/user/queries';
import { getAllTestUsersCreated } from './tools/users';
import { firstBy } from 'thenby';

describe('Group Finder: Small groups', () => {
   test('Matching users below minimum amount does not form a group', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE - 1,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      expect(await retrieveFinalGroupsOf(groupCandidate.users)).toHaveLength(0);
   });

   test('Matching in minimum amount creates a group', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);
      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MIN_GROUP_SIZE);
   });

   test('Additional user matching can enter the group even after creation', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: 'all' });
      await createFullUsersFromGroupCandidate(groupCandidate);

      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MIN_GROUP_SIZE + 1);
   });

   test('Users that decrease the quality of an existing group when joining should not join', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: [0, 1] });

      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Additional users added to a group cannot be higher than maximum configured', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, MAX_GROUP_SIZE + 5, 'all');
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(getBiggestGroup(groups).members.length).toBeLessThanOrEqual(MAX_GROUP_SIZE);
   });

   test('Additional users are not added after too much time', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      // Simulate time passing
      JestDateMock.advanceBy(MAX_TIME_GROUPS_RECEIVE_NEW_USERS * 1000 + hoursToMilliseconds(1));

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, 2, 'all');
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();
      JestDateMock.clear();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Users should not have more groups than what the slots allows', async () => {
      const testUserId: string = 'testUser';

      const groupsAllowedBySize: number[] = GROUP_SLOTS_CONFIGS.map(slot => {
         const result: number[] = [];
         for (let i = 0; i < slot.amount ?? 1; i++) {
            result.push(slot.maximumSize ?? MAX_GROUP_SIZE);
         }
         return result;
      }).flat();
      groupsAllowedBySize.sort(firstBy(s => s));

      // This map creates group candidates with each slot using the amount value
      const groupCandidates = GROUP_SLOTS_CONFIGS.map(slot => {
         const result: GroupCandidate[] = [];
         // We create one more group than what is allowed
         const groupsToCreate: number = (slot.amount ?? 1) + 1;

         for (let i = 0; i < groupsToCreate; i++) {
            const groupCandidate = GroupCandTestTools.createGroupCandidate({
               amountOfInitialUsers: (slot.maximumSize ?? MAX_GROUP_SIZE) - 1,
               connectAllWithAll: true,
            });
            // We add the user to each group
            result.push(
               GroupCandTestTools.createAndAddOneUser({
                  group: groupCandidate,
                  connectWith: 'all',
                  userId: testUserId,
               }),
            );
         }
         return result;
      }).flat();

      // Create the full users
      for (const groupCandidate of groupCandidates) {
         await createFullUsersFromGroupCandidate(groupCandidate);
      }

      // Create the group
      await callGroupFinder();

      const testUserGroups: Group[] = await retrieveFinalGroupsOf([testUserId]);
      const allGroups: Group[] = await retrieveFinalGroupsOf(groupCandidates.map(g => g.users).flat());
      testUserGroups.sort(firstBy(g => g.members.length));

      // The amount of groups for the users is correct:
      expect(testUserGroups).toHaveLength(groupsAllowedBySize.length);
      expect(allGroups).toHaveLength(groupCandidates.length);

      // The user has big and small groups according to slots
      for (let i = 0; i < testUserGroups.length; i++) {
         expect(testUserGroups[i].members).toHaveLength(groupsAllowedBySize[i]);
      }
   });

   afterEach(async () => {
      await queryToRemoveGroups(getAllTestGroupsCreated());
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
