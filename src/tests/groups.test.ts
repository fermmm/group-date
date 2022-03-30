import "jest";
import * as JestDateMock from "jest-date-mock";
import * as GroupCandTestTools from "./tools/group-finder/group-candidate-test-editing";
import {
   chatPost,
   createGroup,
   dateDayVotePost,
   dateIdeaVotePost,
   getSlotIdFromUsersAmount,
   groupGet,
   chatGet,
   userGroupsGet,
   chatUnreadAmountGet,
   findInactiveGroups,
   createTaskToShowRemoveSeenMenu,
} from "../components/groups/models";
import { queryToRemoveGroups } from "../components/groups/queries";
import { setSeenPost, retrieveFullyRegisteredUser, retrieveUser, userGet } from "../components/user/models";
import { queryToRemoveUsers } from "../components/user/queries";
import { Group } from "../shared-tools/endpoints-interfaces/groups";
import { NotificationType, SetSeenAction, TaskType, User } from "../shared-tools/endpoints-interfaces/user";
import { fakeCtx } from "./tools/replacements";
import { createFakeUsers, getAllTestUsersCreated, getEdgeLabelsBetweenUsers } from "./tools/users";
import { GROUP_ACTIVE_TIME, MIN_GROUP_SIZE } from "../configurations";
import { createFullUsersFromGroupCandidate } from "./tools/group-finder/user-creation-tools";
import { hoursToMilliseconds } from "../common-tools/math-tools/general";

describe("Groups", () => {
   let group: Group;
   let group2: Group;
   let group3: Group;
   let fakeUsers: User[];
   let fakeMatchingUsers: User[];
   let mainUser: User;
   let mainUser2: User;
   let mainUser3: User;

   beforeAll(async () => {
      fakeUsers = await createFakeUsers(10);
      fakeMatchingUsers = await createFullUsersFromGroupCandidate(
         GroupCandTestTools.createGroupCandidate({
            amountOfInitialUsers: MIN_GROUP_SIZE,
            connectAllWithAll: true,
         }),
      );
      mainUser = fakeUsers[0];
      mainUser2 = fakeUsers[1];
      mainUser3 = fakeUsers[2];
      group = await createGroup({
         usersIds: fakeUsers.map(u => u.userId),
         slotToUse: getSlotIdFromUsersAmount(fakeUsers.length),
      });
      group2 = await createGroup({ usersIds: [mainUser2.userId], slotToUse: getSlotIdFromUsersAmount(1) });
      group3 = await createGroup({
         usersIds: fakeMatchingUsers.map(u => u.userId),
         slotToUse: getSlotIdFromUsersAmount(fakeMatchingUsers.length),
      });
   });

   test("Voting dating ideas works correctly and not cheating is allowed", async () => {
      // Main user votes for some ideas
      await dateIdeaVotePost(
         {
            token: mainUser.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
         },
         fakeCtx,
      );

      // Main user 2 votes for the same ideas
      await dateIdeaVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
         },
         fakeCtx,
      );

      // Main user 2 removed one vote
      await dateIdeaVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[4].userId],
         },
         fakeCtx,
      );

      // Main user 2 votes the same thing 2 times (should have no effect)
      await dateIdeaVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            ideasToVoteAuthorsIds: [fakeUsers[4].userId],
         },
         fakeCtx,
      );

      group = await groupGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx);

      // The idea with index 4 should be voted by mainUser and mainUser2.
      expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toContain(
         mainUser.userId,
      );
      expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[4].userId).votersUserId).toContain(
         mainUser2.userId,
      );

      // The idea 3 only by mainUser
      expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toContain(
         mainUser.userId,
      );

      // There should be the correct amount of votes
      expect(group.dateIdeasVotes.find(i => i.ideaOfUser === fakeUsers[3].userId).votersUserId).toHaveLength(1);
   });

   test("Voting day option works correctly and not cheating is allowed", async () => {
      // Main user votes for some ideas
      await dateDayVotePost(
         {
            token: mainUser.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[3].date, group.dayOptions[4].date],
         },
         fakeCtx,
      );

      // Main user 2 votes for the same ideas
      await dateDayVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[3].date, group.dayOptions[4].date],
         },
         fakeCtx,
      );

      // Main user 2 removed one vote
      await dateDayVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[4].date],
         },
         fakeCtx,
      );

      // Main user 2 votes the same thing 2 times (should have no effect)
      await dateDayVotePost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            daysToVote: [group.dayOptions[4].date],
         },
         fakeCtx,
      );

      group = await groupGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx);

      // The idea with index 4 should be voted by mainUser and mainUser2.
      expect(group.dayOptions[4].votersUserId.indexOf(mainUser.userId) !== -1).toBe(true);
      expect(group.dayOptions[4].votersUserId.indexOf(mainUser2.userId) !== -1).toBe(true);
      // The idea 3 only by mainUser
      expect(group.dayOptions[3].votersUserId.indexOf(mainUser.userId) !== -1).toBe(true);
      // There should be the correct amount of votes
      expect(group.dayOptions[3].votersUserId.length === 1).toBe(true);
   });

   test("Chat messages are saved correctly", async () => {
      await chatPost({ message: "Hey!", token: mainUser.token, groupId: group.groupId }, fakeCtx);
      await chatPost({ message: "how are you today?", token: mainUser.token, groupId: group.groupId }, fakeCtx);
      await chatPost(
         { message: "I'm so good, I love the world!", token: mainUser2.token, groupId: group.groupId },
         fakeCtx,
      );

      group = await groupGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx);
      const chat = JSON.parse(await chatGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx));

      expect(chat.messages).toHaveLength(3);
      expect(group.chat.messages).toHaveLength(3);
   });

   test("Notifications of new chat messages are received and not with a spamming behavior", async () => {
      mainUser2 = await retrieveFullyRegisteredUser(mainUser2.token, false, fakeCtx);
      const chatNotifications = mainUser2.notifications.filter(
         n => n.targetId === group.groupId && n.type === NotificationType.Chat,
      );
      expect(chatNotifications).toHaveLength(1);
   });

   test("Unread messages counter works", async () => {
      await chatPost(
         { message: "Lets check counter!", token: mainUser.token, groupId: group.groupId },
         fakeCtx,
      );
      await chatPost(
         { message: "With another one also!", token: mainUser.token, groupId: group.groupId },
         fakeCtx,
      );
      const unreadMessages = await chatUnreadAmountGet(
         { groupId: group.groupId, token: mainUser2.token },
         fakeCtx,
      );
      expect(unreadMessages.unread).toBe(5);
   });

   test("User groups are retrieved correctly", async () => {
      const user1Groups: Group[] = await userGroupsGet({ token: mainUser.token }, fakeCtx);
      const user2Groups: Group[] = await userGroupsGet({ token: mainUser2.token }, fakeCtx);
      expect(user1Groups.length).toBe(1);
      expect(user2Groups.length).toBe(2);
   });

   test("Group active property is set to false after some time and related tasks are executed", async () => {
      await findInactiveGroups();

      group3 = await groupGet({ token: fakeMatchingUsers[0].token, groupId: group3.groupId }, fakeCtx);
      expect(group3.isActive).toBeTrue();

      // Simulate time passing
      JestDateMock.advanceBy(GROUP_ACTIVE_TIME * 1000 + hoursToMilliseconds(1));

      await findInactiveGroups();
      // This should be executed inside the function of the previous line but it depends on the settings so we call it here
      await createTaskToShowRemoveSeenMenu(group3);

      group3 = await groupGet({ token: fakeMatchingUsers[0].token, groupId: group3.groupId }, fakeCtx);
      expect(group3.isActive).toBeFalse();

      const updatedUser: Partial<User> = await userGet({ token: fakeMatchingUsers[0].token }, fakeCtx);
      const removeSeenTask = updatedUser.requiredTasks?.find(t => t.type === TaskType.ShowRemoveSeenMenu);

      expect(removeSeenTask).toBeDefined();

      JestDateMock.clear();
   });

   test("SeenMatch can be changed to Match when both users request it", async () => {
      let edges = await getEdgeLabelsBetweenUsers(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
      expect(edges.includes("SeenMatch")).toBeTrue();

      await setSeenPost(
         {
            token: fakeMatchingUsers[0].token,
            setSeenActions: [
               { targetUserId: fakeMatchingUsers[1].token, action: SetSeenAction.RequestRemoveSeen },
            ],
         },
         fakeCtx,
      );

      edges = await getEdgeLabelsBetweenUsers(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
      expect(edges.includes("SeenMatch")).toBeTrue();

      await setSeenPost(
         {
            token: fakeMatchingUsers[1].token,
            setSeenActions: [
               { targetUserId: fakeMatchingUsers[0].token, action: SetSeenAction.RequestRemoveSeen },
            ],
         },
         fakeCtx,
      );

      edges = await getEdgeLabelsBetweenUsers(fakeMatchingUsers[0].userId, fakeMatchingUsers[1].userId);
      expect(edges.includes("SeenMatch")).toBeFalse();
      expect(edges.includes("Match")).toBeTrue();
   });

   afterAll(async () => {
      await queryToRemoveUsers(getAllTestUsersCreated());
      await queryToRemoveGroups([group, group2]);
   });
});
