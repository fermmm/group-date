import 'jest';
import {
   adminChatGet,
   adminChatPost,
   allChatsWithAdminsGet,
   convertToAdmin,
   convertToAdminPost,
} from '../components/admin/models';
import { retrieveFullyRegisteredUser } from '../components/common/models';
import { queryToRemoveUsers } from '../components/common/queries';
import { ChatWithAdmins } from '../shared-tools/endpoints-interfaces/admin';
import { User } from '../shared-tools/endpoints-interfaces/user';
import { fakeCtx } from './tools/replacements';
import { createFakeUsers } from './tools/users';

describe('Users', () => {
   let fakeUsers: User[];
   let mainUser: User;
   let mainUser2: User;
   let adminUser: User;
   let adminUserNatural: User;

   beforeAll(async () => {
      fakeUsers = await createFakeUsers(4);
      mainUser = fakeUsers[0];
      mainUser2 = fakeUsers[1];
      adminUser = fakeUsers[2];
      adminUserNatural = fakeUsers[3];
      await convertToAdmin(adminUser.token);
   });

   test('Non admin users should not be able to convert other users into admins', async () => {
      await convertToAdminPost({ token: mainUser.token, targetUserToken: adminUserNatural.token }, fakeCtx);
      adminUserNatural = await retrieveFullyRegisteredUser(adminUserNatural.token, false, fakeCtx);
      expect(adminUserNatural.isAdmin).toBeFalsy();
   });

   test('Admin users should be able to convert other users into admins', async () => {
      await convertToAdminPost({ token: adminUser.token, targetUserToken: adminUserNatural.token }, fakeCtx);
      adminUserNatural = await retrieveFullyRegisteredUser(adminUserNatural.token, false, fakeCtx);
      expect(adminUserNatural.isAdmin).toBe(true);
   });

   test('Sending messages to admins works', async () => {
      await adminChatPost({ token: mainUser.token, messageText: 'hola que tal' }, fakeCtx);
      await adminChatPost({ token: mainUser.token, messageText: 'una pregunta' }, fakeCtx);

      const chat: ChatWithAdmins = await adminChatGet({ token: mainUser.token }, fakeCtx);
      expect(chat.messages.length).toBe(2);
   });

   test('Admins can read messages', async () => {
      const chat: ChatWithAdmins = await adminChatGet(
         { token: adminUserNatural.token, targetUserId: mainUser.userId },
         fakeCtx,
      );

      expect(chat.messages.length).toBe(2);
      expect(chat.nonAdminUser.userId).toBe(mainUser.userId);
   });

   test('Admins can send messages and identity of admins is hidden', async () => {
      await adminChatPost({ token: mainUser2.token, messageText: 'holis' }, null);
      await adminChatPost(
         { token: adminUser.token, targetUserId: mainUser2.userId, messageText: 'hola que querés' },
         null,
      );

      const chat: ChatWithAdmins = await adminChatGet({ token: mainUser2.token }, null);
      expect(chat.messages.length).toBe(2);
      expect(chat.messages[0].authorUserId).toBe(mainUser2.userId);
      expect(chat.messages[1].authorUserId).toBeFalsy();
   });

   test('Admins can get a list of all chats', async () => {
      const chats: ChatWithAdmins[] = await allChatsWithAdminsGet(
         { token: adminUser.token, excludeRespondedByAdmin: false },
         null,
      );
      expect(chats.length).toBe(2);
   });

   test('Admins can get a list of all chats filtered by responded by admins', async () => {
      const chats: ChatWithAdmins[] = await allChatsWithAdminsGet(
         { token: adminUser.token, excludeRespondedByAdmin: true },
         null,
      );
      expect(chats.length).toBe(1);
   });

   afterAll(async () => {
      await queryToRemoveUsers(fakeUsers);
   });
});
