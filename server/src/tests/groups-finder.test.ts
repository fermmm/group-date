import "jest";
import * as JestDateMock from "jest-date-mock";
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
   getAllTestGroupsCreated,
   getSmallerSlot,
   retrieveFinalGroupsOf,
} from "./tools/group-finder/user-creation-tools";
import * as GroupCandTestTools from "./tools/group-finder/group-candidate-test-editing";
import {
   GROUP_SLOTS_CONFIGS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
} from "../configurations";
import { Group, Slot } from "../shared-tools/endpoints-interfaces/groups";
import { getBiggestGroup } from "./tools/groups";
import { hoursToMilliseconds } from "../common-tools/math-tools/general";
import { GroupCandidate, GroupCandidateAnalyzed } from "../components/groups-finder/tools/types";
import { queryToRemoveGroups } from "../components/groups/queries";
import { queryToRemoveUsers } from "../components/user/queries";
import { getAllTestUsersCreated } from "./tools/users";
import { firstBy } from "thenby";
import { slotsIndexesOrdered } from "../components/groups-finder/models";
import { analiceGroupCandidate } from "../components/groups-finder/tools/group-candidate-analysis";
import { tryToFixBadQualityGroupIfNeeded } from "../components/groups-finder/tools/group-candidate-editing";
import { findSlotsToRelease } from "../components/groups/models";
import {
   getTestingGroups,
   getTestingGroupsFilteredAndSorted,
   groupAnalysisReport,
   analiceFilterAndSortReport,
} from "./tools/group-finder/group-candidates-ordering";

describe("Group finder", () => {
   test("Matching users below minimum amount does not form a group", async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE - 1,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      expect(await retrieveFinalGroupsOf(groupCandidate.users)).toHaveLength(0);
   });

   test("Matching in minimum amount creates a group", async () => {
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

   test("Additional user matching can enter the group even after creation", async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: "all" });
      await createFullUsersFromGroupCandidate(groupCandidate);

      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MIN_GROUP_SIZE + 1);
   });

   test("Users that decrease the quality of an existing group when joining should not join", async () => {
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

   test("Additional users added to a group cannot be higher than maximum configured", async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, MAX_GROUP_SIZE + 5, "all");
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(getBiggestGroup(groups).members.length).toBeLessThanOrEqual(MAX_GROUP_SIZE);
   });

   test("Additional users are not added after too much time", async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      // Simulate time passing
      JestDateMock.advanceBy(MAX_TIME_GROUPS_RECEIVE_NEW_USERS * 1000 + hoursToMilliseconds(1));

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, 2, "all");
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();
      JestDateMock.clear();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test("Users should not have more groups than what the slots allows", async () => {
      const testUserId: string = "testUser";

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
                  connectWith: "all",
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

   test("Only one group is created when many users like all with all", async () => {
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

   test("A group with more members than MAX_GROUP_SIZE cannot be created", async () => {
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

   test("Seen users cannot form a group again", async () => {
      const testUsersIds: string[] = ["testUser1", "testUser2", "testUser3"];

      // Create 2 triangle groups
      const triangle1 = GroupCandTestTools.createGroupCandidateWithCustomIds({
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

   test("Too bad quality groups gets fixed before creation and not ruined when adding more users afterwards", async () => {
      const groupWith2 = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 2,
         connectAllWithAll: false,
      });
      const badGroupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupWith2, 8, [0, 1]);

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

   test("From 2 groups that shares users only the best quality one is created", async () => {
      const slotsOrdered = [...GROUP_SLOTS_CONFIGS];
      slotsOrdered.sort(firstBy(s => s.minimumSize ?? 0));

      const groupWith2 = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 2,
         connectAllWithAll: true,
      });
      let badGroupCandidate: GroupCandidate;

      for (let i = 0; i < slotsOrdered.length; i++) {
         const slot = slotsOrdered[i];
         if (i === 0) {
            /**
             * Here we create a bad group candidate that should never
             * be converted into a final group because is less good than
             * the groups created next
             */
            badGroupCandidate = GroupCandTestTools.createAndAddMultipleUsers(
               groupWith2,
               (slot.maximumSize ?? MAX_GROUP_SIZE) - 2,
               [0, 1],
            );
            await createFullUsersFromGroupCandidate(badGroupCandidate);
         }

         // Fill the rest of the slots with good groups
         for (let u = 0; u < slot.amount; u++) {
            const goodGroupToFillSlot = GroupCandTestTools.createAndAddMultipleUsers(
               groupWith2,
               (slot.maximumSize ?? MAX_GROUP_SIZE) - 2,
               "all",
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

   test("Slots gets free after time passes", async () => {
      const singleUserGroup = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 1,
         connectAllWithAll: false,
      });

      const smallerSlot: Slot = getSmallerSlot();
      const smallerSlotMinSize: number = smallerSlot.minimumSize ?? MIN_GROUP_SIZE;
      const groupsRequiredToFillSlot: number = smallerSlot.amount;
      const groupCandidatesToCreate = groupsRequiredToFillSlot * 3;

      /**
       * For our main user create twice more groups than the user can have at the same time
       * in the smaller slot.
       */
      for (let i = 0; i < groupCandidatesToCreate; i++) {
         await createFullUsersFromGroupCandidate(
            GroupCandTestTools.createAndAddMultipleUsers(singleUserGroup, smallerSlotMinSize - 1, "all"),
         );
      }

      let groupsCreated: Group[] = await callGroupFinder();

      // Only half of the group candidates created should be converted into final groups
      expect(groupsCreated).toHaveLength(groupsRequiredToFillSlot);

      // Call the function to release slots but shouldn't release any slot because no time has passed
      await findSlotsToRelease();

      // Try again but still shouldn't be possible to create the other groups because slot is still full
      groupsCreated = await callGroupFinder();
      expect(groupsCreated).toHaveLength(0);

      // Simulate time passing
      JestDateMock.advanceBy(smallerSlot.releaseTime * 1000 + hoursToMilliseconds(1));

      // Now the function to release slot should release it because time has passed
      await findSlotsToRelease();

      // Try again but this time the other group should be created because the slot got free
      groupsCreated = await callGroupFinder();
      expect(groupsCreated).toHaveLength(groupsRequiredToFillSlot);

      // Try again but this time should not create a group because the slot is full again
      await findSlotsToRelease();
      groupsCreated = await callGroupFinder();
      expect(groupsCreated).toHaveLength(0);

      JestDateMock.clear();
   });

   test("All groups that should be created gets created", async () => {
      const testingGroups: GroupCandidateAnalyzed[] = getTestingGroups();
      const groupsFilteredAndSorted: GroupCandidateAnalyzed[] = getTestingGroupsFilteredAndSorted();

      for (const groupCandidate of testingGroups) {
         await createFullUsersFromGroupCandidate(groupCandidate.group);
      }

      const groupsCreated = await callGroupFinder();

      expect(groupsCreated.length).toBeGreaterThanOrEqual(groupsFilteredAndSorted.length);
   });

   test("Group analysis was not modified", async () => {
      /**
       * If this snapshot does not match anymore it means you changed code or a setting that affects
       * group analysis and you should check if everything is still working as expected before re
       * generating the snapshot.
       */
      expect(groupAnalysisReport()).toMatchSnapshot();

      /**
       * In that case uncomment this line and check if you are happy with the console output
       * (besides checking all other possible things)
       */
      // consoleLog(groupAnalysisReport());
   });

   test("Group filter and sorting was not modified", async () => {
      /**
       * If this snapshot does not match anymore it means you changed code or a setting that affects
       * group analysis, filtering and/or sorting and you should check if everything is still working
       * as expected before re generating the snapshot.
       */
      expect(analiceFilterAndSortReport()).toMatchSnapshot();

      /**
       * In that case uncomment this line and check if you are happy with the console output
       * (besides checking all other possible things)
       */
      //  consoleLog(analiceFilterAndSortReport());
   });

   afterEach(async () => {
      await queryToRemoveGroups(getAllTestGroupsCreated());
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
