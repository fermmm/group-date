import 'jest';
import { User } from '../shared-tools/endpoints-interfaces/user';
import { queryToRemoveUsers } from '../components/user/queries';
import {
   callGroupCreationMultipleTimes,
   createFullUsersFromGroupCandidate,
   retrieveFinalGroupsOf,
} from './tools/group-finder/user-creation-tools';
import * as GroupCandTestTools from './tools/group-finder/group-candidate-test-editing';
import { MAX_GROUP_SIZE, MIN_GROUP_SIZE } from '../configurations';
import { Group } from '../shared-tools/endpoints-interfaces/groups';
import { queryToRemoveGroups } from '../components/groups/queries';
import { getBiggestGroup } from './tools/groups';

/**
 * Ciclo de vida de un grupo chico:
 *    - [Hecho] Un usuario que hace match con 1 o con 2 en V, no debería formar grupo
 *    - [Hecho] Cuando los usuarios conectan en 3 deberían formar grupo
 *    - [Hecho] Un usuario que matchea puede ser agregado al grupo
 *    - [Hecho] Cuando 2 usuarios podrían ingresar al grupo creado pero uno disminuye su calidad solo deberia entrar el que la aumenta
 *    - Testear ambas opciones de ALLOW_SMALL_GROUPS_BECOME_BIG agregando mas usuarios al grupo
 *    - Simular paso del tiempo y asegurarse que no acepta mas usuarios
 *    - Crear matches para formar otro grupo que no se debería formar por que a los usuarios no les queda un slot
 *
 * Ciclo de vida de un grupo grande:
 *    - Agregar usuarios para formar un grupo mas grande y ejecutar la busqueda con cada cambio para asegurarse que no pase nada raro en el proceso de matching
 *    - Checkear que los usuarios que ya habian formado un grupo chico en el test anterior no vuelvan a estar juntos en el grande
 *    - Crear 3 grupos grandes, uno que es demasiado malo y deberia ser filtrado, y 2 que uno es mejor que el otro y el segundo no se puede formar si el primero se forma por que los usuarios quedan ocupados
 *    - Crear un grupo mas grande que el limite maximo de los grupos y checkear que el temaño este ok
 *
 * Checkeos finales:
 *    - Checkear que los slots se liberan simulando el paso del tiempo
 *    - Hacer un snapshot con los resultados del archivo group-candidates-ordering.ts
 */

describe('Group Finder', () => {
   const usersCreated: User[] = [];
   const groupsCreated: Group[] = [];

   let smallGroup = GroupCandTestTools.createGroupCandidate({
      amountOfInitialUsers: MIN_GROUP_SIZE - 1,
      connectAllWithAll: true,
   });

   test('Matching users below minimum amount does not form a group', async () => {
      const users: User[] = await createFullUsersFromGroupCandidate(smallGroup);
      usersCreated.push(...users);

      await callGroupCreationMultipleTimes();

      const groups: Group[] = await retrieveFinalGroupsOf(smallGroup.users);
      groupsCreated.push(...groups);

      expect(groups).toHaveLength(0);
   });

   test('Matching in minimum amount creates a group', async () => {
      smallGroup = GroupCandTestTools.createAndAddOneUser({ group: smallGroup, connectWith: 'all' });
      const users: User[] = await createFullUsersFromGroupCandidate(smallGroup);
      usersCreated.push(...users);

      await callGroupCreationMultipleTimes();

      const groups: Group[] = await retrieveFinalGroupsOf(smallGroup.users);
      groupsCreated.push(...groups);

      expect(groups).toHaveLength(1);
   });

   test('Adicional user matching can enter the group even after creation', async () => {
      smallGroup = GroupCandTestTools.createAndAddOneUser({ group: smallGroup, connectWith: 'all' });
      const users: User[] = await createFullUsersFromGroupCandidate(smallGroup);
      usersCreated.push(...users);

      await callGroupCreationMultipleTimes();

      const groups: Group[] = await retrieveFinalGroupsOf(smallGroup.users);
      groupsCreated.push(...groups);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Users that decrease the quality of an existing group when joining should not join', async () => {
      smallGroup = GroupCandTestTools.createAndAddOneUser({ group: smallGroup, connectWith: [0, 1] });
      const users = await createFullUsersFromGroupCandidate(smallGroup);
      usersCreated.push(...users);

      await callGroupCreationMultipleTimes();

      const groups: Group[] = await retrieveFinalGroupsOf(smallGroup.users);
      groupsCreated.push(...groups);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Additional users added to a group cannot be higher than maximum configured', async () => {
      // TODO: Si pongo 300 nunca devuelve nada pero tampoco usa ni la ram ni el CPU, parece mas un bug
      // smallGroup = GroupCandTestTools.createAndAddMultipleUsers(smallGroup, 300, 'all');

      const users: User[] = await createFullUsersFromGroupCandidate(smallGroup);
      usersCreated.push(...users);

      await callGroupCreationMultipleTimes();

      const groups: Group[] = await retrieveFinalGroupsOf(smallGroup.users);
      groupsCreated.push(...groups);

      expect(getBiggestGroup(groups).members.length).toBeLessThanOrEqual(MAX_GROUP_SIZE);
   });

   afterAll(async () => {
      await queryToRemoveUsers(usersCreated);
      await queryToRemoveGroups(groupsCreated);
   });
});
