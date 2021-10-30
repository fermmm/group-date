"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const models_1 = require("../components/groups/models");
const queries_1 = require("../components/groups/queries");
const models_2 = require("../components/user/models");
const queries_2 = require("../components/user/queries");
const groups_1 = require("../shared-tools/endpoints-interfaces/groups");
const user_1 = require("../shared-tools/endpoints-interfaces/user");
const replacements_1 = require("./tools/replacements");
const users_1 = require("./tools/users");
describe("Groups", () => {
    let group;
    let group2;
    let fakeUsers;
    let mainUser;
    let mainUser2;
    let mainUser3;
    beforeAll(async () => {
        fakeUsers = await (0, users_1.createFakeUsers)(10);
        mainUser = fakeUsers[0];
        mainUser2 = fakeUsers[1];
        mainUser3 = fakeUsers[2];
        group = await (0, models_1.createGroup)({
            usersIds: fakeUsers.map(u => u.userId),
            slotToUse: (0, models_1.getSlotIdFromUsersAmount)(fakeUsers.length),
        });
        group2 = await (0, models_1.createGroup)({ usersIds: [mainUser2.userId], slotToUse: (0, models_1.getSlotIdFromUsersAmount)(1) });
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
        expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toContain(mainUser.userId);
        expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toContain(mainUser2.userId);
        // The idea 3 only by mainUser
        expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toContain(mainUser.userId);
        // There should be the correct amount of votes
        expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toHaveLength(1);
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
        expect(group.dayOptions[4].votersUserId.indexOf(mainUser.userId) !== -1).toBe(true);
        expect(group.dayOptions[4].votersUserId.indexOf(mainUser2.userId) !== -1).toBe(true);
        // The idea 3 only by mainUser
        expect(group.dayOptions[3].votersUserId.indexOf(mainUser.userId) !== -1).toBe(true);
        // There should be the correct amount of votes
        expect(group.dayOptions[3].votersUserId.length === 1).toBe(true);
    });
    test("Chat messages are saved correctly", async () => {
        await (0, models_1.chatPost)({ message: "Hey!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "how are you today?", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "I'm so good, I love the world!", token: mainUser2.token, groupId: group.groupId }, replacements_1.fakeCtx);
        group = await (0, models_1.groupGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        const chat = JSON.parse(await (0, models_1.chatGet)({ token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx));
        expect(chat.messages).toHaveLength(3);
        expect(group.chat.messages).toHaveLength(3);
    });
    test("Notifications of new chat messages are received and not with a spamming behavior", async () => {
        mainUser2 = await (0, models_2.retrieveFullyRegisteredUser)(mainUser2.token, false, replacements_1.fakeCtx);
        const chatNotifications = mainUser2.notifications.filter(n => n.targetId === group.groupId && n.type === user_1.NotificationType.Chat);
        expect(chatNotifications).toHaveLength(1);
    });
    test("Unread messages counter works", async () => {
        await (0, models_1.chatPost)({ message: "Lets check counter!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        await (0, models_1.chatPost)({ message: "With another one also!", token: mainUser.token, groupId: group.groupId }, replacements_1.fakeCtx);
        const unreadMessages = await (0, models_1.chatUnreadAmountGet)({ groupId: group.groupId, token: mainUser2.token }, replacements_1.fakeCtx);
        expect(unreadMessages.unread).toBe(5);
    });
    test("Feedback gets saved correctly", async () => {
        await (0, models_1.feedbackPost)({
            token: mainUser.token,
            groupId: group.groupId,
            feedback: {
                feedbackType: groups_1.ExperienceFeedbackType.AssistedAndLovedIt,
                description: "Everything went so good!. I love the world!",
            },
        }, replacements_1.fakeCtx);
        await (0, models_1.feedbackPost)({
            token: mainUser2.token,
            groupId: group.groupId,
            feedback: {
                feedbackType: groups_1.ExperienceFeedbackType.DidntWantToGo,
                description: "I hate this app.",
            },
        }, replacements_1.fakeCtx);
        group = await (0, models_1.getGroupById)(group.groupId, { protectPrivacy: false });
        expect(group.feedback.length).toBe(2);
    });
    test("User groups are retrieved correctly", async () => {
        const user1Groups = await (0, models_1.userGroupsGet)({ token: mainUser.token }, replacements_1.fakeCtx);
        const user2Groups = await (0, models_1.userGroupsGet)({ token: mainUser2.token }, replacements_1.fakeCtx);
        expect(user1Groups.length).toBe(1);
        expect(user2Groups.length).toBe(2);
    });
    afterAll(async () => {
        await (0, queries_2.queryToRemoveUsers)((0, users_1.getAllTestUsersCreated)());
        await (0, queries_1.queryToRemoveGroups)([group, group2]);
    });
});
//# sourceMappingURL=groups.test.js.map