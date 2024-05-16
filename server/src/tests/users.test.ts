import "mocha";
import { assert } from "chai";
import { initAppForTests } from "./tools/beforeAllTests";
import { createGroup, getSlotIdFromUsersAmount } from "../components/groups/models";
import { queryToRemoveGroups } from "../components/groups/queries";
import {
   addNotificationToUser,
   attractionsReceivedGet,
   attractionsSentGet,
   matchesGet,
   profileStatusGet,
   userGet,
} from "../components/user/models";
import { queryToRemoveUsers } from "../components/user/queries";
import { Group } from "../shared-tools/endpoints-interfaces/groups";
import { AttractionType, Gender, NotificationType, User } from "../shared-tools/endpoints-interfaces/user";
import { createMatchingUsers } from "./tools/groups";
import { fakeCtx } from "./tools/replacements";
import { createFakeUser, getAllTestUsersCreated, setAttraction } from "./tools/users";

describe("Users", () => {
   let matchingUsersCouple1: User[];
   let matchingUsersCouple2: User[];
   let matchingUsersCouple3: User[];
   let matching10: User[];
   let matching10Group: Group;
   let testProtagonist: User;

   before(async () => {
      await initAppForTests();
      matchingUsersCouple1 = await createMatchingUsers(2);
      matchingUsersCouple2 = await createMatchingUsers(2);
      matchingUsersCouple3 = await createMatchingUsers(2);
      matching10 = await createMatchingUsers(10);
      testProtagonist = await createFakeUser(null, {
         withRandomQuestionResponses: true, // Here we use the random question responses prop to achieve a really complete profile so we can test the code that checks for profile completeness
         simulateProfileComplete: false,
      });
   });

   it("A user profile can be completed", async () => {
      await profileStatusGet({ token: testProtagonist.token }, fakeCtx);
      const updatedUser = await userGet({ token: testProtagonist.token }, fakeCtx);
      assert(updatedUser.profileCompleted === true);
   });

   it("Notifications works", async () => {
      await addNotificationToUser(
         { token: matchingUsersCouple1[0].token },
         {
            type: NotificationType.Group,
            title: "Prueba",
            text: "sarasa2",
            targetId: "http://sarasa.com",
         },
      );
      await addNotificationToUser(
         { token: matchingUsersCouple1[0].token },
         {
            type: NotificationType.NearbyPartyOrEvent,
            title: "sarasa3",
            text: "sarasa4",
            targetId: "http://sarasa.com",
         },
      );

      const updatedUser: Partial<User> = await userGet({ token: matchingUsersCouple1[0].token }, fakeCtx);
      // There is a notification created when the user is created but it does not get created in the tests
      assert(updatedUser.notifications.length === 2);
   });

   it("Attraction works", async () => {
      // Self liking should be not possible
      await setAttraction(testProtagonist, [testProtagonist], AttractionType.Like);
      assert((await attractionsSentGet(testProtagonist.token, [AttractionType.Like])).length === 0);
      assert((await attractionsReceivedGet(testProtagonist.token, [AttractionType.Like])).length === 0);

      // Multiple likes sent simultaneously gets saved
      await setAttraction(testProtagonist, matchingUsersCouple2, AttractionType.Like);
      await setAttraction(testProtagonist, matchingUsersCouple3, AttractionType.Dislike);
      assert(
         (await attractionsSentGet(testProtagonist.token, [AttractionType.Like])).length ===
            matchingUsersCouple2.length,
      );
      assert(
         (await attractionsSentGet(testProtagonist.token, [AttractionType.Dislike])).length ===
            matchingUsersCouple3.length,
      );
      assert((await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like])).length === 1);
      assert(
         (await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like]))[0].userId ===
            testProtagonist.userId,
      );

      // Matches can be added and removed without losing information
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Like);
      await setAttraction(matchingUsersCouple2[1], [testProtagonist], AttractionType.Like);
      assert((await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like])).length === 0);
      assert((await matchesGet(matchingUsersCouple2[0].token)).length === 2);
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Dislike);
      assert((await matchesGet(matchingUsersCouple2[0].token)).length === 1);
      assert(
         (await attractionsReceivedGet(testProtagonist.token, [AttractionType.Dislike]))[0].userId ===
            matchingUsersCouple2[0].userId,
      );
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Like);
      assert((await matchesGet(matchingUsersCouple2[0].token)).length === 2);
      assert((await attractionsReceivedGet(testProtagonist.token, [AttractionType.Dislike])).length === 0);

      // Other users don't get affected by the previous lines
      assert((await matchesGet(matchingUsersCouple1[0].token)).length === 1);
      assert((await matchesGet(matchingUsersCouple1[1].token)).length === 1);
      assert((await matchesGet(matchingUsersCouple1[0].token))[0].userId === matchingUsersCouple1[1].userId);
      assert((await matchesGet(matchingUsersCouple1[1].token))[0].userId === matchingUsersCouple1[0].userId);
      assert((await matchesGet(matching10[matching10.length - 1].token)).length === matching10.length - 1);

      // After a group creation the users "Match" are converted into a "SeenMatch" and it should not be possible to change set attraction anymore
      matching10Group = await createGroup({
         usersIds: matching10.map(u => u.userId), // Creating a group converts matches into seen matches
         slotToUse: getSlotIdFromUsersAmount(matching10.length),
      });
      await setAttraction(matching10[0], [matching10[1]], AttractionType.Dislike);
      assert((await attractionsSentGet(matching10[0].token, [AttractionType.Dislike])).length === 0);
   });

   after(async () => {
      await queryToRemoveUsers(getAllTestUsersCreated());
      await queryToRemoveGroups([matching10Group]);
   });
});
