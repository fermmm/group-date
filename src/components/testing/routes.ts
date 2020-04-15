import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { removeUsers } from '../common/queries';
import { acceptPost, addUsersToGroup, createGroup, getGroupById, votePost } from '../groups/models';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      const group = await createGroup();
      const fakeUsers = await createFakeUsers(10);
      const mainUser = fakeUsers[0];
      const mainUser2 = fakeUsers[1];
      await addUsersToGroup(fakeUsers, group);

      /**
       * TODO: Reparar esto que seguro se rompio con los nuevos cambios en la funcion que retorna el grupo que pide un nuevo parametro
       * TODO: Agregar testeos para: chatPost, groupGet, feedbackPost y userGroupsGet
       */

      // group = await getGroupWithMembersById(group.groupId);

      // console.log(group.dateIdeas.length === fakeUsers.length); // Deberia estar poblada la lista de date ideas

      // for (const user of fakeUsers) {
      //    await acceptPost({ token: user.token, groupId: group.groupId }, null);
      // }

      // group = await getGroupById(group.groupId);

      // console.log(group.usersThatAccepted.length === fakeUsers.length); // Deberia estar poblada la lista de usuarios que aceptan

      // // Main user votes for 2 ideas
      // await votePost(
      //    {
      //       token: mainUser.token,
      //       groupId: group.groupId,
      //       votedIdeasAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
      //    },
      //    null,
      // );
      // // Main user 2 votes for 2 ideas
      // await votePost(
      //    {
      //       token: mainUser2.token,
      //       groupId: group.groupId,
      //       votedIdeasAuthorsIds: [fakeUsers[3].userId, fakeUsers[4].userId],
      //    },
      //    null,
      // );
      // // Main user 2 removed one vote
      // await votePost(
      //    {
      //       token: mainUser2.token,
      //       groupId: group.groupId,
      //       votedIdeasAuthorsIds: [fakeUsers[4].userId],
      //    },
      //    null,
      // );
      // // Main user 2 votes the same thing 2 times (should not do anything)
      // await votePost(
      //    {
      //       token: mainUser2.token,
      //       groupId: group.groupId,
      //       votedIdeasAuthorsIds: [fakeUsers[4].userId],
      //    },
      //    null,
      // );

      // group = await getGroupById(group.groupId);

      // // The idea with index 4 should be voted by mainUser and mainUser2. The idea 3 only by mainUser
      // console.log(
      //    group.dateIdeas[4].votersUserId.indexOf(mainUser.userId) !== -1 &&
      //       group.dateIdeas[4].votersUserId.indexOf(mainUser2.userId) !== -1 &&
      //       group.dateIdeas[3].votersUserId.indexOf(mainUser.userId) !== -1 &&
      //       group.dateIdeas[3].votersUserId.length === 1,
      // );

      await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
