"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const JestDateMock = require("jest-date-mock");
const user_creation_tools_1 = require("./tools/group-finder/user-creation-tools");
const GroupCandTestTools = require("./tools/group-finder/group-candidate-test-editing");
const configurations_1 = require("../configurations");
const groups_1 = require("./tools/groups");
const general_1 = require("../common-tools/math-tools/general");
const queries_1 = require("../components/groups/queries");
const queries_2 = require("../components/user/queries");
const users_1 = require("./tools/users");
const thenby_1 = require("thenby");
const models_1 = require("../components/groups-finder/models");
const group_candidate_analysis_1 = require("../components/groups-finder/tools/group-candidate-analysis");
const group_candidate_editing_1 = require("../components/groups-finder/tools/group-candidate-editing");
const models_2 = require("../components/groups/models");
const group_candidates_ordering_1 = require("./tools/group-finder/group-candidates-ordering");
describe("Group finder", () => {
    test("Matching users below minimum amount does not form a group", async () => {
        const groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: configurations_1.MIN_GROUP_SIZE - 1,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        expect(await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users)).toHaveLength(0);
    });
    test("Matching in minimum amount creates a group", async () => {
        const groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: configurations_1.MIN_GROUP_SIZE,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(1);
        expect(groups[0].members).toHaveLength(configurations_1.MIN_GROUP_SIZE);
    });
    test("Additional user matching can enter the group even after creation", async () => {
        let groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: configurations_1.MIN_GROUP_SIZE,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: "all" });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(1);
        expect(groups[0].members).toHaveLength(configurations_1.MIN_GROUP_SIZE + 1);
    });
    test("Users that decrease the quality of an existing group when joining should not join", async () => {
        let groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: 4,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: [0, 1] });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(1);
        expect(groups[0].members).toHaveLength(4);
    });
    test("Additional users added to a group cannot be higher than maximum configured", async () => {
        let groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: 4,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, configurations_1.MAX_GROUP_SIZE + 5, "all");
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect((0, groups_1.getBiggestGroup)(groups).members.length).toBeLessThanOrEqual(configurations_1.MAX_GROUP_SIZE);
    });
    test("Additional users are not added after too much time", async () => {
        let groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: 4,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        // Simulate time passing
        JestDateMock.advanceBy(configurations_1.MAX_TIME_GROUPS_RECEIVE_NEW_USERS * 1000 + (0, general_1.hoursToMilliseconds)(1));
        groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, 2, "all");
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        JestDateMock.clear();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(1);
        expect(groups[0].members).toHaveLength(4);
    });
    test("Users should not have more groups than what the slots allows", async () => {
        const testUserId = "testUser";
        const groupsAllowedBySize = configurations_1.GROUP_SLOTS_CONFIGS.map(slot => {
            var _a, _b;
            const result = [];
            for (let i = 0; (_a = i < slot.amount) !== null && _a !== void 0 ? _a : 1; i++) {
                result.push((_b = slot.maximumSize) !== null && _b !== void 0 ? _b : configurations_1.MAX_GROUP_SIZE);
            }
            return result;
        }).flat();
        groupsAllowedBySize.sort((0, thenby_1.firstBy)(s => s));
        // This map creates group candidates with each slot using the amount value
        const groupCandidates = configurations_1.GROUP_SLOTS_CONFIGS.map(slot => {
            var _a, _b;
            const result = [];
            // We create one more group than what is allowed
            const groupsToCreate = ((_a = slot.amount) !== null && _a !== void 0 ? _a : 1) + 1;
            for (let i = 0; i < groupsToCreate; i++) {
                const groupCandidate = GroupCandTestTools.createGroupCandidate({
                    amountOfInitialUsers: ((_b = slot.maximumSize) !== null && _b !== void 0 ? _b : configurations_1.MAX_GROUP_SIZE) - 1,
                    connectAllWithAll: true,
                });
                // We add the user to each group
                result.push(GroupCandTestTools.createAndAddOneUser({
                    group: groupCandidate,
                    connectWith: "all",
                    userId: testUserId,
                }));
            }
            return result;
        }).flat();
        // Create the full users
        for (const groupCandidate of groupCandidates) {
            await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        }
        // Create the group
        await (0, user_creation_tools_1.callGroupFinder)();
        const testUserGroups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)([testUserId]);
        const allGroups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidates.map(g => g.users).flat());
        testUserGroups.sort((0, thenby_1.firstBy)(g => g.members.length));
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
            amountOfInitialUsers: configurations_1.MAX_GROUP_SIZE,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(1);
        expect(groups[0].members).toHaveLength(configurations_1.MAX_GROUP_SIZE);
    });
    test("A group with more members than MAX_GROUP_SIZE cannot be created", async () => {
        const groupCandidate = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: configurations_1.MAX_GROUP_SIZE * 2,
            connectAllWithAll: true,
        });
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(groupCandidate.users);
        expect(groups).toHaveLength(2);
        expect(groups[0].members).toHaveLength(configurations_1.MAX_GROUP_SIZE);
        expect(groups[1].members).toHaveLength(configurations_1.MAX_GROUP_SIZE);
    });
    test("Seen users cannot form a group again", async () => {
        const testUsersIds = ["testUser1", "testUser2", "testUser3"];
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
        testUsersIds.forEach((userId, i) => (triangle2 = GroupCandTestTools.createAndAddOneUser({
            group: triangle2,
            connectWith: [i],
            userId,
        })));
        /*
         * At this point if we create all the users we generate a big group of 2 triangles
         * but we are going to create 1 triangle of users first and form a small group with
         * it, then we will create the other users. This way the big group cannot form because
         * one of the triangles already meet each other.
         */
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(triangle1);
        await (0, user_creation_tools_1.callGroupFinder)();
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(triangle2);
        await (0, user_creation_tools_1.callGroupFinder)();
        const createdGroups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)([...triangle1.users, ...triangle2.users]);
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
        await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(badGroupCandidate);
        await (0, user_creation_tools_1.callGroupFinder)();
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(badGroupCandidate.users);
        const badGroupCandidateFixed = (0, group_candidate_editing_1.tryToFixBadQualityGroupIfNeeded)((0, group_candidate_analysis_1.analiceGroupCandidate)(badGroupCandidate), (0, models_1.slotsIndexesOrdered)().reverse()[0]);
        expect(groups).toHaveLength(1);
        expect(groups[0].members.length).toBeLessThanOrEqual(badGroupCandidateFixed.group.users.length);
    });
    test("From 2 groups that shares users only the best quality one is created", async () => {
        var _a, _b;
        const slotsOrdered = [...configurations_1.GROUP_SLOTS_CONFIGS];
        slotsOrdered.sort((0, thenby_1.firstBy)(s => { var _a; return (_a = s.minimumSize) !== null && _a !== void 0 ? _a : 0; }));
        const groupWith2 = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: 2,
            connectAllWithAll: true,
        });
        let badGroupCandidate;
        for (let i = 0; i < slotsOrdered.length; i++) {
            const slot = slotsOrdered[i];
            if (i === 0) {
                /**
                 * Here we create a bad group candidate that should never
                 * be converted into a final group because is less good than
                 * the groups created next
                 */
                badGroupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupWith2, ((_a = slot.maximumSize) !== null && _a !== void 0 ? _a : configurations_1.MAX_GROUP_SIZE) - 2, [0, 1]);
                await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(badGroupCandidate);
            }
            // Fill the rest of the slots with good groups
            for (let u = 0; u < slot.amount; u++) {
                const goodGroupToFillSlot = GroupCandTestTools.createAndAddMultipleUsers(groupWith2, ((_b = slot.maximumSize) !== null && _b !== void 0 ? _b : configurations_1.MAX_GROUP_SIZE) - 2, "all");
                await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(goodGroupToFillSlot);
            }
        }
        await (0, user_creation_tools_1.callGroupFinder)();
        /**
         * Get the users that should not have a group and check they don't have it
         */
        const usersThatShouldNotHaveGroup = badGroupCandidate.users.reduce((p, v) => {
            if (v.userId !== groupWith2.users[0].userId && v.userId !== groupWith2.users[1].userId) {
                p.push(v);
            }
            return p;
        }, []);
        const groups = await (0, user_creation_tools_1.retrieveFinalGroupsOf)(usersThatShouldNotHaveGroup);
        expect(groups).toHaveLength(0);
    });
    test("Slots gets free after time passes", async () => {
        var _a;
        const singleUserGroup = GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: 1,
            connectAllWithAll: false,
        });
        const smallerSlot = (0, user_creation_tools_1.getSmallerSlot)();
        const smallerSlotMinSize = (_a = smallerSlot.minimumSize) !== null && _a !== void 0 ? _a : configurations_1.MIN_GROUP_SIZE;
        const groupsRequiredToFillSlot = smallerSlot.amount;
        const groupCandidatesToCreate = groupsRequiredToFillSlot * 3;
        /**
         * For our main user create twice more groups than the user can have at the same time
         * in the smaller slot.
         */
        for (let i = 0; i < groupCandidatesToCreate; i++) {
            await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(GroupCandTestTools.createAndAddMultipleUsers(singleUserGroup, smallerSlotMinSize - 1, "all"));
        }
        let groupsCreated = await (0, user_creation_tools_1.callGroupFinder)();
        // Only half of the group candidates created should be converted into final groups
        expect(groupsCreated).toHaveLength(groupsRequiredToFillSlot);
        // Call the function to release slots but shouldn't release any slot because no time has passed
        await (0, models_2.findSlotsToRelease)();
        // Try again but still shouldn't be possible to create the other groups because slot is still full
        groupsCreated = await (0, user_creation_tools_1.callGroupFinder)();
        expect(groupsCreated).toHaveLength(0);
        // Simulate time passing
        JestDateMock.advanceBy(smallerSlot.releaseTime * 1000 + (0, general_1.hoursToMilliseconds)(1));
        // Now the function to release slot should release it because time has passed
        await (0, models_2.findSlotsToRelease)();
        // Try again but this time the other group should be created because the slot got free
        groupsCreated = await (0, user_creation_tools_1.callGroupFinder)();
        expect(groupsCreated).toHaveLength(groupsRequiredToFillSlot);
        // Try again but this time should not create a group because the slot is full again
        await (0, models_2.findSlotsToRelease)();
        groupsCreated = await (0, user_creation_tools_1.callGroupFinder)();
        expect(groupsCreated).toHaveLength(0);
        JestDateMock.clear();
    });
    test("All groups that should be created gets created", async () => {
        const testingGroups = (0, group_candidates_ordering_1.getTestingGroups)();
        const groupsFilteredAndSorted = (0, group_candidates_ordering_1.getTestingGroupsFilteredAndSorted)();
        for (const groupCandidate of testingGroups) {
            await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(groupCandidate.group);
        }
        const groupsCreated = await (0, user_creation_tools_1.callGroupFinder)();
        expect(groupsCreated.length).toBeGreaterThanOrEqual(groupsFilteredAndSorted.length);
    });
    test("Group analysis was not modified", async () => {
        /**
         * If this snapshot does not match anymore it means you changed code or a setting that affects
         * group analysis and you should check if everything is still working as expected before re
         * generating the snapshot.
         */
        expect((0, group_candidates_ordering_1.groupAnalysisReport)()).toMatchSnapshot();
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
        expect((0, group_candidates_ordering_1.analiceFilterAndSortReport)()).toMatchSnapshot();
        /**
         * In that case uncomment this line and check if you are happy with the console output
         * (besides checking all other possible things)
         */
        //  consoleLog(analiceFilterAndSortReport());
    });
    afterEach(async () => {
        await (0, queries_1.queryToRemoveGroups)((0, user_creation_tools_1.getAllTestGroupsCreated)());
        await (0, queries_2.queryToRemoveUsers)((0, users_1.getAllTestUsersCreated)());
    });
});
//# sourceMappingURL=groups-finder.test.js.map