import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { removeUsers } from '../common/queries';

// TODO: Hay que trabajar en las notificaciones y despues en el aviso de nuevos usuarios
export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // const fakeUsers = await createFakeUsers(4);
      // const mainUser = fakeUsers[0];
      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
