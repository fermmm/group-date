import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { removeUsers } from '../common/queries';
import { acceptPost, addUsersToGroup, createGroup, getGroupById, votePost } from '../groups/models';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      let group = await createGroup();
      const fakeUsers = await createFakeUsers(10);
      const mainUser = fakeUsers[0];
      const mainUser2 = fakeUsers[1];
      await addUsersToGroup(fakeUsers, group);

      /**
       * TODO: Agregar testeos para: chatPost, groupGet, feedbackPost y userGroupsGet
       */

      group = await getGroupById(group.groupId, true);

      console.log(group);

      await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
