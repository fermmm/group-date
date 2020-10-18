import 'jest';
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
   getAllTestGroupsCreated,
   retrieveFinalGroupsOf,
} from './tools/group-finder/user-creation-tools';
import * as GroupCandTestTools from './tools/group-finder/group-candidate-test-editing';
import { GROUP_SLOTS_CONFIGS, MAX_GROUP_SIZE } from '../configurations';
import { queryToRemoveGroups } from '../components/groups/queries';
import { queryToRemoveUsers } from '../components/user/queries';
import { getAllTestUsersCreated } from './tools/users';
import { Group } from '../shared-tools/endpoints-interfaces/groups';
import { firstBy } from 'thenby';
import {
   createAndAddMultipleUsers,
   createGroupCandidate,
   createGroupCandidateWithCustomIds,
} from './tools/group-finder/group-candidate-test-editing';
import { GroupCandidate } from '../components/groups-finder/tools/types';
import { tryToFixBadQualityGroupIfNeeded } from '../components/groups-finder/tools/group-candidate-editing';
import { slotsIndexesOrdered } from '../components/groups-finder/models';
import { analiceGroupCandidate } from '../components/groups-finder/tools/group-candidate-analysis';

/**
 * TODO: Checkeos finales:
 *    - Checkear que los slots se liberan simulando el paso del tiempo
 *    - Hacer un snapshot con los resultados del archivo group-candidates-ordering.ts
 */

describe('Group Finder: Big groups', () => {
   test('Only one group is created when many users like all with all', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MAX_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);
      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MAX_GROUP_SIZE);
   });

   test('A group with more members than MAX_GROUP_SIZE cannot be created', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MAX_GROUP_SIZE * 2,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);
      expect(groups).toHaveLength(2);
      expect(groups[0].members).toHaveLength(MAX_GROUP_SIZE);
      expect(groups[1].members).toHaveLength(MAX_GROUP_SIZE);
   });

   test('Seen users cannot form a group again', async () => {
      const testUsersIds: string[] = ['testUser1', 'testUser2', 'testUser3'];

      // Create 2 triangle groups
      const triangle1 = createGroupCandidateWithCustomIds({
         usersIds: testUsersIds,
         connectAllWithAll: true,
      });

      let triangle2 = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 3,
         connectAllWithAll: true,
      });

      /**
       * Connect the 2 triangles in a way that each user has 2 matches of the "local"
       * triangle and 1 match to the "foreign" triangle
       */
      testUsersIds.forEach(
         (userId, i) =>
            (triangle2 = GroupCandTestTools.createAndAddOneUser({
               group: triangle2,
               connectWith: [i],
               userId,
            })),
      );

      /*
       * At this point if we create all the users we generate a big group of 2 triangles
       * but we are going to create 1 triangle of users first and form a small group with
       * it, then we will create the other users. This way the big group cannot form because
       * one of the triangles already meet each other.
       */
      await createFullUsersFromGroupCandidate(triangle1);
      await callGroupFinder();

      await createFullUsersFromGroupCandidate(triangle2);
      await callGroupFinder();

      const createdGroups: Group[] = await retrieveFinalGroupsOf([...triangle1.users, ...triangle2.users]);
      expect(createdGroups).toHaveLength(2);
      expect(createdGroups[0].members).toHaveLength(3);
      expect(createdGroups[1].members).toHaveLength(3);
      expect(createdGroups[0].groupId !== createdGroups[1].groupId).toBeTrue();
   });

   test('Too bad quality groups gets fixed before creation and not ruined when adding more users afterwards', async () => {
      const groupWith2 = createGroupCandidate({ amountOfInitialUsers: 2, connectAllWithAll: false });
      const badGroupCandidate = createAndAddMultipleUsers(groupWith2, 8, [0, 1]);

      await createFullUsersFromGroupCandidate(badGroupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(badGroupCandidate.users);

      const badGroupCandidateFixed = tryToFixBadQualityGroupIfNeeded(
         analiceGroupCandidate(badGroupCandidate),
         slotsIndexesOrdered().reverse()[0],
      );

      expect(groups).toHaveLength(1);
      expect(groups[0].members.length).toBeLessThanOrEqual(badGroupCandidateFixed.group.users.length);
   });

   test('From 2 groups that shares users only the best quality one is created', async () => {
      const slotsOrdered = [...GROUP_SLOTS_CONFIGS];
      slotsOrdered.sort(firstBy(s => s.minimumSize ?? 0));

      const groupWith2 = createGroupCandidate({ amountOfInitialUsers: 2, connectAllWithAll: true });
      let badGroupCandidate: GroupCandidate;

      for (let i = 0; i < slotsOrdered.length; i++) {
         const slot = slotsOrdered[i];
         if (i === 0) {
            /**
             * Here we create a bad group candidate that should never
             * be converted into a final group because is less good than
             * the groups created next
             */
            badGroupCandidate = createAndAddMultipleUsers(
               groupWith2,
               (slot.maximumSize ?? MAX_GROUP_SIZE) - 2,
               [0, 1],
            );
            await createFullUsersFromGroupCandidate(badGroupCandidate);
         }

         // Fill the rest of the slots with good groups
         for (let u = 0; u < slot.amount; u++) {
            const goodGroupToFillSlot = createAndAddMultipleUsers(
               groupWith2,
               (slot.maximumSize ?? MAX_GROUP_SIZE) - 2,
               'all',
            );
            await createFullUsersFromGroupCandidate(goodGroupToFillSlot);
         }
      }

      await callGroupFinder();

      /**
       * Get the users that should not have a group and check they don't have it
       */
      const usersThatShouldNotHaveGroup = badGroupCandidate.users.reduce((p, v) => {
         if (v.userId !== groupWith2.users[0].userId && v.userId !== groupWith2.users[1].userId) {
            p.push(v);
         }
         return p;
      }, []);

      const groups: Group[] = await retrieveFinalGroupsOf(usersThatShouldNotHaveGroup);

      expect(groups).toHaveLength(0);
   });

   afterEach(async () => {
      await queryToRemoveGroups(getAllTestGroupsCreated());
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
