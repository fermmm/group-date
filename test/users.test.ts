import 'jest';
import { removeUsers } from '../src/components/common/queries';
import { addNotificationToUser, userGet, profileStatusGet } from '../src/components/user/models';
import { NotificationType, User } from '../src/shared-tools/endpoints-interfaces/user';
import { fakeCtx } from './tools/replacements';
import { createFakeUsers } from './tools/users';

describe('Users', () => {
   const FAKE_USERS_AMMOUNT: number = 20;
   let fakeUsers: Array<Partial<User>>;

   beforeAll(async () => {
      fakeUsers = await createFakeUsers(FAKE_USERS_AMMOUNT);
   });

   test('Fake users are created', () => {
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMMOUNT);
   });

   test('Fake users profile is completed', async () => {
      await profileStatusGet({ token: fakeUsers[0].token }, fakeCtx);
      const updatedUser: Partial<User> = await userGet({ token: fakeUsers[0].token }, fakeCtx);
      expect(updatedUser.profileCompleted).toBe(true);
   });

   test('Notifications work', async () => {
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

   afterAll(async () => {
      await removeUsers(fakeUsers);
   });
});
