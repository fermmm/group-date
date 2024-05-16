"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const earl_1 = require("earl");
const beforeAllTests_1 = require("./tools/beforeAllTests");
const GroupCandTestTools = require("./tools/group-finder/group-candidate-test-editing");
const models_1 = require("../components/groups/models");
const queries_1 = require("../components/groups/queries");
const models_2 = require("../components/user/models");
const queries_2 = require("../components/user/queries");
const user_1 = require("../shared-tools/endpoints-interfaces/user");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
const configurations_1 = require("../configurations");
const user_creation_tools_1 = require("./tools/group-finder/user-creation-tools");
const general_1 = require("../common-tools/math-tools/general");
const decodeString_1 = require("../shared-tools/utility-functions/decodeString");
const generalTools_1 = require("./tools/generalTools");
const test = it;
describe("Groups", () => {
    let group;
    let group2;
    let group3;
    let fakeUsers;
    let fakeMatchingUsers;
    let mainUser;
    let mainUser2;
    let mainUser3;
    before(async () => {
        await (0, beforeAllTests_1.initAppForTests)();
        fakeUsers = await (0, users_1.createFakeUsers)(10);
        fakeMatchingUsers = await (0, user_creation_tools_1.createFullUsersFromGroupCandidate)(GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: configurations_1.MIN_GROUP_SIZE,
            connectAllWithAll: true,
        }));
        mainUser = fakeUsers[0];
        mainUser2 = fakeUsers[1];
        mainUser3 = fakeUsers[2];
        group = await (0, models_1.createGroup)({
            usersIds: fakeUsers.map(u => u.userId),
            slotToUse: (0, models_1.getSlotIdFromUsersAmount)(fakeUsers.length),
        });
        group2 = await (0, models_1.createGroup)({ usersIds: [mainUser2.userId], slotToUse: (0, models_1.getSlotIdFromUsersAmount)(1) });
        group3 = await (0, models_1.createGroup)({
            usersIds: fakeMatchingUsers.map(u => u.userId),
            slotToUse: (0, models_1.getSlotIdFromUsersAmount)(fakeMatchingUsers.length),
        });
    });
    test("Voting dating ideas works correctly and not cheating is allowed", async () => {
        // Main user votes for some ideas
        await (0, models_1.dateIdeaVotePost)({
            token: mainUser.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
        }, replacements_1.fakeCtx);
        // Main user 2 votes for the same ideas
        await (0, models_1.dateIdeaVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
        }, replacements_1.fakeCtx);
        // Main user 2 removed one vote
        await (0, models_1.dateIdeaVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[4].userId],
        }, replacements_1.fakeCtx);
        // Main user 2 votes the same thing 2 times (should have no effect)
        await (0, models_1.dateIdeaVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[4].userId],
        }, replacements_1.fakeCtx);
        group = await (0, models_1.groupGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        // The idea with index 4 should be voted by mainUser and mainUser2.
        (0, earl_1.expect)(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toInclude(mainUser.userId);
        (0, earl_1.expect)(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toInclude(mainUser2.userId);
        // The idea 3 only by mainUser
        (0, earl_1.expect)(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toInclude(mainUser.userId);
        // There should be the correct amount of votes
        (0, earl_1.expect)(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toHaveLength(1);
    });
    test("Voting day option works correctly and not cheating is allowed", async () => {
        // Main user votes for some ideas
        await (0, models_1.dateDayVotePost)({
            token: mainUser.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[3].date, group.dayOptions[4].date],
        }, replacements_1.fakeCtx);
        // Main user 2 votes for the same ideas
        await (0, models_1.dateDayVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[3].date, group.dayOptions[4].date],
        }, replacements_1.fakeCtx);
        // Main user 2 removed one vote
        await (0, models_1.dateDayVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[4].date],
        }, replacements_1.fakeCtx);
        // Main user 2 votes the same thing 2 times (should have no effect)
        await (0, models_1.dateDayVotePost)({
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[4].date],
        }, replacements_1.fakeCtx);
        group = await (0, models_1.groupGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        // The idea with index 4 should be voted by mainUser and mainUser2.
        (0, earl_1.expect)(group.dayOptions[4].votersUserId.indexOf(mainUser.userId) !== -1).toEqual(true);
        (0, earl_1.expect)(group.dayOptions[4].votersUserId.indexOf(mainUser2.userId) !== -1).toEqual(true);
        // The idea 3 only by mainUser
        (0, earl_1.expect)(group.dayOptions[3].votersUserId.indexOf(mainUser.userId) !== -1).toEqual(true);
        // There should be the correct amount of votes
        (0, earl_1.expect)(group.dayOptions[3].votersUserId.length === 1).toEqual(true);
    });
    test("Chat messages are saved correctly", async () => {
        await (0, models_1.chatPost)({ message: "Hey!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "how are you today?", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "I'm so good, I love the world!", token: mainUser2.token, groupId: group.groupId }, replacements_1.fakeCtx);
        group = await (0, models_1.groupGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        let response = await (0, models_1.chatGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        response = (0, decodeString_1.decodeString)(response);
        const chat = JSON.parse(response);
        (0, earl_1.expect)(chat.messages).toHaveLength(3);
        (0, earl_1.expect)(group.chat.messages).toHaveLength(3);
    });
    test("Notifications of new chat messages are received and not with a spamming behavior", async () => {
        mainUser2 = await (0, models_2.retrieveFullyRegisteredUser)(mainUser2.token, false, replacements_1.fakeCtx);
        const chatNotifications = mainUser2.notifications.filter(n => n.targetId === group.groupId && n.type === user_1.NotificationType.Chat);
        (0, earl_1.expect)(chatNotifications).toHaveLength(1);
    });
    test("Unread messages counter works", async () => {
        await (0, models_1.chatPost)({ message: "Lets check counter!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "With another one also!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        const unreadMessages = await (0, models_1.chatUnreadAmountGet)({ groupId: group.groupId, token: mainUser2.token }, replacements_1.fakeCtx);
        (0, earl_1.expect)(unreadMessages.unread).toEqual(5);
    });
    test("User groups are retrieved correctly", async () => {
        const user1Groups = await (0, models_1.userGroupsGet)({ token: mainUser.token }, replacements_1.fakeCtx);
        const user2Groups = await (0, models_1.userGroupsGet)({ token: mainUser2.token }, replacements_1.fakeCtx);
        (0, earl_1.expect)(user1Groups.length).toEqual(1);
        (0, earl_1.expect)(user2Groups.length).toEqual(2);
    });
    test("Group active property is set to false after some time and related tasks are executed", async () => {
        var _a;
        await (0, models_1.findInactiveGroups)();
        group3 = await (0, models_1.groupGet)({ token: fakeMatchingUsers[0].token, groupId: group3.groupId }, replacements_1.fakeCtx);
        (0, earl_1.expect)(group3.isActive).toEqual(true);
        // Simulate time passing
        (0, generalTools_1.changeCurrentTimeBy)(configurations_1.GROUP_ACTIVE_TIME * 1000 + (0, general_1.hoursToMilliseconds)(1));
        await (0, models_1.findInactiveGroups)();
        // This should be executed inside the function of the previous line but it depends on the settings so we call it here
        await (0, models_1.createTaskToShowRemoveSeenMenu)(group3);
        group3 = await (0, models_1.groupGet)({ token: fakeMatchingUsers[0].token, groupId: group3.groupId }, replacements_1.fakeCtx);
        (0, earl_1.expect)(group3.isActive).toEqual(false);
        const updatedUser = await (0, models_2.userGet)({ token: fakeMatchingUsers[0].token }, replacements_1.fakeCtx);
        const removeSeenTask = (_a = updatedUser.requiredTasks) === null || _a === void 0 ? void 0 : _a.find(t => t.type === user_1.TaskType.ShowRemoveSeenMenu);
        (0, earl_1.expect)(removeSeenTask).not.toBeNullish();
        (0, generalTools_1.resetTime)();
    });
    test("SeenMatch can be changed to Match when both users request it", async () => {
        let edges = await (0, users_1.getEdgeLabelsBetweenUsers)(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
        (0, earl_1.expect)(edges.includes("SeenMatch")).toEqual(true);
        await (0, models_2.setSeenPost)({
            token: fakeMatchingUsers[0].token,
            setSeenActions: [
                { targetUserId: fakeMatchingUsers[1].token, action: user_1.SetSeenAction.RequestRemoveSeen },
            ],
        }, replacements_1.fakeCtx);
        edges = await (0, users_1.getEdgeLabelsBetweenUsers)(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
        (0, earl_1.expect)(edges.includes("SeenMatch")).toEqual(true);
        await (0, models_2.setSeenPost)({
            token: fakeMatchingUsers[1].token,
            setSeenActions: [
                { targetUserId: fakeMatchingUsers[0].token, action: user_1.SetSeenAction.RequestRemoveSeen },
            ],
        }, replacements_1.fakeCtx);
        edges = await (0, users_1.getEdgeLabelsBetweenUsers)(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
        (0, earl_1.expect)(edges.includes("SeenMatch")).toEqual(false);
        (0, earl_1.expect)(edges.includes("Match")).toEqual(true);
    });
    after(async () => {
        await (0, queries_2.queryToRemoveUsers)((0, users_1.getAllTestUsersCreated)());
        await (0, queries_1.queryToRemoveGroups)([group, group2]);
    });
});
//# sourceMappingURL=groups.test.js.map