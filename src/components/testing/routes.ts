import * as Router from '@koa/router';
import { THEME_CREATION_TIME_FRAME } from '../../configurations';
import { createFakeUser } from '../../tests/tools/users';
import { createThemePost } from '../themes/models';
import { queryToCreateThemes, queryToGetThemesCreatedByUser } from '../themes/queries';
import { queryToRemoveUsers } from '../user/queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();

      await createThemePost(
         {
            token: testUser.token,
            name: 'pruebaa que pruebaaa',
            category: 'other',
            global: false,
         },
         null,
      );

      const recentlyCreatedThemes = await queryToGetThemesCreatedByUser(
         testUser.userId,
         THEME_CREATION_TIME_FRAME,
      ).toList();

      console.log(recentlyCreatedThemes.length);
   });

   router.get('/testing2', async ctx => {
      ctx.body = `Finished OK`;
   });
}
