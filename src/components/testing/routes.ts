import * as Router from '@koa/router';
import { createFakeUsers } from '../../../test/tools/users';
import { setTimeoutAsync } from '../../common-tools/js-tools/js-tools';
import { removeUsers } from '../common/queries';

/**
 * TODO: Notificaciones:
 *    1. Agregar las notificaciones al objeto del usuario
 *    2. Hacer una funcion interna que agrega una notificacion
 *    3. Hacer que haya notificaciones al levantar el usuario
 *
 * TODO: Aviso de nuevos usuarios:
 *    1. Hacer una prop en el usuario de aviso de usuarios con la cantidad de usuarios a avisar 0 = desactivado
 *    2. Esa prop se setea con un endpoint, que el clinete va a llamar cuando no quedan mas usuarios
 *    3. Hacer un metodo interno que levanta todos los usuarios con esa variable activada y les busca usuarios
 *       y cuando encuentra la cantidad de usuarios desactiva la variable y envia la notificacion
 *    4. Buscar la mejor manera de hacer tareas programadas y que se ejecuten al arrancar el server asi se puede testear
 *
 * TODO: Votacion de momento de la cita:
 *    1. [Hecho] Agregar lo necesario a las interfaces del grupo
 *    2. Crear una funcion que agrega los viernes, sabado y domingo de las siguientes 4 semanas
 *    3. Solo para tener en cuenta:
 *          Un grupo se cierra 3 dias antes de la fecha mas votada o de la ultima
 *          Las opciones de votacion se agregan cuando el grupo es publicado a sus miembros, de momento no se cuando va a pasar eso
 */
export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // const fakeUsers = await createFakeUsers(4);
      // const mainUser = fakeUsers[0];
      // await removeUsers(fakeUsers);
      ctx.body = `Finished OK`;
   });
}
