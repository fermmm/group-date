import * as Router from '@koa/router';
import { fakeCtx } from '../../../test/tools/replacements';
import { createFakeUsers } from '../../../test/tools/users';
import { ExperienceFeedbackType, Group } from '../../shared-tools/endpoints-interfaces/groups';
import { recommendationsGet } from '../cards-game/models';
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
import { userGet } from '../user/models';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // let group = await createGroup();
      // let group2 = await createGroup();
      const fakeUsers = await createFakeUsers(200);
      const mainUser = fakeUsers[0];
      // const mainUser2 = fakeUsers[1];
      // await addUsersToGroup(fakeUsers, group);
      // await addUsersToGroup([mainUser2], group2);

      for (let i = 0; i < 30; i++) {
         console.time('Recommendations query time ' + i);
         console.log((await recommendationsGet({ token: mainUser.token }, fakeCtx)).length);
         console.timeEnd('Recommendations query time ' + i);
      }

      for (let i = 0; i < 4; i++) {
         console.time('Recommendations query time ' + i);
         console.log((await userGet({ token: mainUser.token }, fakeCtx)).name);
         console.timeEnd('Recommendations query time ' + i);
      }

      await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
