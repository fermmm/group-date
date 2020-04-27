import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { removeUsers } from '../common/queries';

/**
 * TODO: Aviso de nuevos usuarios:
 *    1. Hacer una prop en el usuario de aviso de usuarios con la cantidad de usuarios a avisar 0 = desactivado
 *    2. Esa prop se setea con un endpoint, que el cliente va a llamar cuando no quedan mas usuarios
 *    3. Hacer un método interno que levanta todos los usuarios con esa variable activada y les busca usuarios
 *       y cuando encuentra la cantidad de usuarios desactiva la variable y enviá la notificación
 *    4. Buscar la mejor manera de hacer tareas programadas y que se ejecuten al arrancar el server asi se puede testear
 *
 */
export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // const fakeUsers = await createFakeUsers(4);
      // const mainUser = fakeUsers[0];
      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
