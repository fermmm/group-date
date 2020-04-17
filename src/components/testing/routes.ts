import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { ExperienceFeedbackType, Group } from '../../shared-tools/endpoints-interfaces/groups';
import { removeUsers } from '../common/queries';
import {
   acceptPost,
   addUsersToGroup,
   chatPost,
   createGroup,
   feedbackPost,
   getGroupById,
   groupGet,
   userGroupsGet,
   votePost,
} from '../groups/models';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // let group = await createGroup();
      // let group2 = await createGroup();
      // const fakeUsers = await createFakeUsers(10);
      // const mainUser = fakeUsers[0];
      // const mainUser2 = fakeUsers[1];
      // await addUsersToGroup(fakeUsers, group);
      // await addUsersToGroup([mainUser2], group2);

      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
