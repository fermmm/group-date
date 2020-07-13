import 'jest';
import { removeUsers } from '../src/components/common/queries';
import {
   addNotificationToUser,
   attractionsReceivedGet,
   attractionsSentGet,
   matchesGet,
   profileStatusGet,
   userGet,
} from '../src/components/user/models';
import { AttractionType, NotificationType, User } from '../src/shared-tools/endpoints-interfaces/user';
import { createMatchingUsers } from './tools/groups';
import { fakeCtx } from './tools/replacements';
import { createFakeUser, createFakeUsers, setAttraction } from './tools/users';

describe('Users', () => {
   const FAKE_USERS_AMOUNT: number = 20;
   let fakeUsers: Array<Partial<User>>;
   let matchingUsersCouple1: User[];
   let matchingUsersCouple2: User[];
   let matchingUsersCouple3: User[];
   let matchingGroup: User[];

   beforeAll(async () => {
      matchingUsersCouple1 = await createMatchingUsers(2);
      matchingUsersCouple2 = await createMatchingUsers(2);
      matchingUsersCouple3 = await createMatchingUsers(2);
      matchingGroup = await createMatchingUsers(10);
      fakeUsers = await createFakeUsers(FAKE_USERS_AMOUNT);
   });

   test('Fake users are created', () => {
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMOUNT);
   });

   test('Fake users profile is completed', async () => {
      await profileStatusGet({ token: fakeUsers[0].token }, fakeCtx);
      const updatedUser: Partial<User> = await userGet({ token: fakeUsers[0].token }, fakeCtx);
      expect(updatedUser.profileCompleted).toBe(true);
   });

   test('Notifications works', async () => {
      await addNotificationToUser(fakeUsers[0].token, {
         type: NotificationType.Group,
         title: 'Prueba',
         text: 'sarasa2',
         targetId: 'http://sarasa.com',
      });
      await addNotificationToUser(fakeUsers[0].token, {
         type: NotificationType.FacebookEvent,
         title: 'sarasa3',
         text: 'sarasa4',
         targetId: 'http://sarasa.com',
      });

      const updatedUser: Partial<User> = await userGet({ token: fakeUsers[0].token }, fakeCtx);
      expect(updatedUser.notifications.length).toBe(2);
   });

   test('Attraction works', async () => {
      // Multiple likes sent simultaneously gets saved
      const testProtagonist: User = await createFakeUser();
      await setAttraction(testProtagonist, matchingUsersCouple2, AttractionType.Like);
      await setAttraction(testProtagonist, matchingUsersCouple3, AttractionType.Dislike);
      expect(await attractionsSentGet(testProtagonist.token, [AttractionType.Like])).toHaveLength(
         matchingUsersCouple2.length,
      );
      expect(await attractionsSentGet(testProtagonist.token, [AttractionType.Dislike])).toHaveLength(
         matchingUsersCouple3.length,
      );
      expect(await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like])).toHaveLength(
         1,
      );
      expect(
         (await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like]))[0].userId,
      ).toBe(testProtagonist.userId);

      // Matches can be added and removed without losing information
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Like);
      await setAttraction(matchingUsersCouple2[1], [testProtagonist], AttractionType.Like);
      expect(await attractionsReceivedGet(matchingUsersCouple2[0].token, [AttractionType.Like])).toHaveLength(
         0,
      );
      expect(await matchesGet(matchingUsersCouple2[0].token)).toHaveLength(2);
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Dislike);
      expect(await matchesGet(matchingUsersCouple2[0].token)).toHaveLength(1);
      expect((await attractionsReceivedGet(testProtagonist.token, [AttractionType.Dislike]))[0].userId).toBe(
         matchingUsersCouple2[0].userId,
      );
      await setAttraction(matchingUsersCouple2[0], [testProtagonist], AttractionType.Like);
      expect(await matchesGet(matchingUsersCouple2[0].token)).toHaveLength(2);
      expect(await attractionsReceivedGet(testProtagonist.token, [AttractionType.Dislike])).toHaveLength(0);

      // Other users don't get affected by the previous lines
      expect(await matchesGet(matchingUsersCouple1[0].token)).toHaveLength(1);
      expect(await matchesGet(matchingUsersCouple1[1].token)).toHaveLength(1);
      expect((await matchesGet(matchingUsersCouple1[0].token))[0].userId).toBe(matchingUsersCouple1[1].userId);
      expect((await matchesGet(matchingUsersCouple1[1].token))[0].userId).toBe(matchingUsersCouple1[0].userId);
      expect(await matchesGet(matchingGroup[matchingGroup.length - 1].token)).toHaveLength(
         matchingGroup.length - 1,
      );
   });

   afterAll(async () => {
      await removeUsers([
         ...fakeUsers,
         ...matchingUsersCouple1,
         ...matchingUsersCouple2,
         ...matchingUsersCouple3,
         ...matchingGroup,
      ]);
   });
});
