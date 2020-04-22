import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { ChatWithAdmins } from '../../shared-tools/endpoints-interfaces/admin';
import { adminChatPost, allChatsWithAdminsGet, convertToAdmin } from '../admin/models';
import { removeUsers } from '../common/queries';

// TODO: Hacer los tests
export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      const fakeUsers = await createFakeUsers(3);
      const mainUser = fakeUsers[0];
      const mainUser2 = fakeUsers[1];
      const adminUser = fakeUsers[2];

      await convertToAdmin(adminUser.token);

      await adminChatPost({ token: mainUser.token, messageText: 'hola que tal' }, null);
      await adminChatPost({ token: mainUser.token, messageText: 'una pregunta' }, null);

      await setTimeoutAsync(1500);

      await adminChatPost({ token: mainUser2.token, messageText: 'holis' }, null);
      await adminChatPost(
         { token: adminUser.token, targetUserId: mainUser2.userId, messageText: 'hola que queres' },
         null,
      );

      const chats: ChatWithAdmins[] = await allChatsWithAdminsGet(
         { token: adminUser.token, excludeRespondedByAdmin: false },
         null,
      );

      chats?.forEach(c => console.log(c.messages));

      await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
