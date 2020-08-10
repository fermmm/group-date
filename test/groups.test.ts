import 'jest';
import { queryToRemoveUsers } from '../src/components/common/queries';
import {
   acceptPost,
   chatPost,
   createGroup,
   dateDayVotePost,
   dateIdeaVotePost,
   feedbackPost,
   getGroupById,
   getSlotIdFromUsersAmount,
   groupGet,
   userGroupsGet,
} from '../src/components/groups/models';
import { ExperienceFeedbackType, Group } from '../src/shared-tools/endpoints-interfaces/groups';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { fakeCtx } from './tools/replacements';
import { createFakeUsers } from './tools/users';

describe('Groups', () => {
   let group: Group;
   let group2: Group;
   let fakeUsers: User[];
   let mainUser: User;
   let mainUser2: User;

   beforeAll(async () => {
      fakeUsers = await createFakeUsers(10);
      mainUser = fakeUsers[0];
      mainUser2 = fakeUsers[1];
      group = await createGroup({
         usersIds: fakeUsers.map(u => u.userId),
         slotToUse: getSlotIdFromUsersAmount(fakeUsers.length),
      });
      group2 = await createGroup({ usersIds: [mainUser2.userId], slotToUse: getSlotIdFromUsersAmount(1) });
   });

   test('Users that accept the group are stored correctly', async () => {
      for (const user of fakeUsers) {
         await acceptPost({ token: user.token, groupId: group.groupId }, null);
      }
      group = await groupGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx);
      expect(group.usersThatAccepted.length === fakeUsers.length).toBe(true);
   });

   test('Voting dating ideas works correctly and not cheating is allowed', async () => {
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
      expect(group.dateIdeasVotes[fakeUsers[4].userId]).toContain(mainUser.userId);
      expect(group.dateIdeasVotes[fakeUsers[4].userId]).toContain(mainUser2.userId);

      // The idea 3 only by mainUser
      expect(group.dateIdeasVotes[fakeUsers[3].userId]).toContain(mainUser.userId);

      // There should be the correct amount of votes
      expect(group.dateIdeasVotes[fakeUsers[3].userId]).toHaveLength(1);
   });

   test('Voting day option works correctly and not cheating is allowed', async () => {
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

   test('Chat messages are saved correctly', async () => {
      await chatPost(
         { message: 'Hey, how are you today?', token: mainUser.token, groupId: group.groupId },
         fakeCtx,
      );
      await chatPost(
         { message: "I'm so good, I love the world!", token: mainUser2.token, groupId: group.groupId },
         fakeCtx,
      );

      group = await groupGet({ token: mainUser.token, groupId: group.groupId }, fakeCtx);

      expect(group.chat.messages.length).toEqual(2);
   });

   test('The action of a user downloading a message is recorded correctly', async () => {
      // mainUser downloads the messages, this groupGet call simulates that
      await groupGet({ token: mainUser.token, groupId: group.groupId }, null);

      // Now we retrieve the group again to check if stored correctly the read
      group = await getGroupById(group.groupId);
      expect(group.chat.usersDownloadedLastMessage.length).toBe(1);
      expect(group.chat.usersDownloadedLastMessage[0]).toBe(mainUser.userId);

      // Now mainUser2 downloads the messages
      await groupGet({ token: mainUser2.token, groupId: group.groupId }, null);

      // Now we retrieve the group again to check if stored correctly the read
      group = await getGroupById(group.groupId);
      expect(group.chat.usersDownloadedLastMessage.length).toBe(2);
   });

   test('Feedback gets saved correctly', async () => {
      await feedbackPost(
         {
            token: mainUser.token,
            groupId: group.groupId,
            feedback: {
               feedbackType: ExperienceFeedbackType.AssistedAndLovedIt,
               description: 'Everything went so good!. I love the world!',
            },
         },
         fakeCtx,
      );
      await feedbackPost(
         {
            token: mainUser2.token,
            groupId: group.groupId,
            feedback: {
               feedbackType: ExperienceFeedbackType.DidntWantToGo,
               description: 'I hate this app.',
            },
         },
         fakeCtx,
      );
      group = await getGroupById(group.groupId, { protectPrivacy: false });
      expect(group.feedback.length).toBe(2);
   });

   test('User groups are retrieved correctly', async () => {
      const user1Groups: Group[] = await userGroupsGet({ token: mainUser.token }, fakeCtx);
      const user2Groups: Group[] = await userGroupsGet({ token: mainUser2.token }, fakeCtx);
      expect(user1Groups.length).toBe(1);
      expect(user2Groups.length).toBe(2);
   });

   afterAll(async () => {
      await queryToRemoveUsers(fakeUsers);
   });
});
