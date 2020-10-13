import 'jest';
import * as JestDateMock from 'jest-date-mock';
import {
   callGroupFinder,
   createFullUsersFromGroupCandidate,
   getAllTestGroupsCreated,
   retrieveFinalGroupsOf,
} from './tools/group-finder/user-creation-tools';
import * as GroupCandTestTools from './tools/group-finder/group-candidate-test-editing';
import {
   GROUP_SLOTS_CONFIGS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
} from '../configurations';
import { Group } from '../shared-tools/endpoints-interfaces/groups';
import { getBiggestGroup } from './tools/groups';
import { hoursToMilliseconds } from '../common-tools/math-tools/general';
import { GroupCandidate } from '../components/groups-finder/tools/types';
import { queryToRemoveGroups } from '../components/groups/queries';
import { queryToRemoveUsers } from '../components/user/queries';
import { getAllTestUsersCreated } from './tools/users';

/**
 * Ciclo de vida de un grupo chico:
 *    - [Hecho] Un usuario que hace match con 1 o con 2 en V, no debería formar grupo
 *    - [Hecho] Cuando los usuarios conectan en 3 deberían formar grupo
 *    - [Hecho] Un usuario que matchea puede ser agregado al grupo
 *    - [Hecho] Cuando 2 usuarios podrían ingresar al grupo creado pero uno disminuye su calidad solo deberia entrar el que la aumenta
 *    - [Hecho] Simular paso del tiempo y asegurarse que no acepta mas usuarios
 *    - [Hecho] Crear matches para formar otro grupo que no se debería formar por que a los usuarios no les queda un slot
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
   test('Matching users below minimum amount does not form a group', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE - 1,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      expect(await retrieveFinalGroupsOf(groupCandidate.users)).toHaveLength(0);
   });

   test('Matching in minimum amount creates a group', async () => {
      const groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);
      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MIN_GROUP_SIZE);
   });

   test('Additional user matching can enter the group even after creation', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: MIN_GROUP_SIZE,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: 'all' });
      await createFullUsersFromGroupCandidate(groupCandidate);

      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(MIN_GROUP_SIZE + 1);
   });

   test('Users that decrease the quality of an existing group when joining should not join', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddOneUser({ group: groupCandidate, connectWith: [0, 1] });

      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Additional users added to a group cannot be higher than maximum configured', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, MAX_GROUP_SIZE + 5, 'all');
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(getBiggestGroup(groups).members.length).toBeLessThanOrEqual(MAX_GROUP_SIZE);
   });

   test('Additional users are not added after too much time', async () => {
      let groupCandidate = GroupCandTestTools.createGroupCandidate({
         amountOfInitialUsers: 4,
         connectAllWithAll: true,
      });
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();

      // Simulate time passing
      JestDateMock.advanceBy(MAX_TIME_GROUPS_RECEIVE_NEW_USERS * 1000 + hoursToMilliseconds(1));

      groupCandidate = GroupCandTestTools.createAndAddMultipleUsers(groupCandidate, 2, 'all');
      await createFullUsersFromGroupCandidate(groupCandidate);
      await callGroupFinder();
      JestDateMock.clear();

      const groups: Group[] = await retrieveFinalGroupsOf(groupCandidate.users);

      expect(groups).toHaveLength(1);
      expect(groups[0].members).toHaveLength(4);
   });

   test('Users should not have more groups than what the slots allows', async () => {
      const testUserId: string = 'testUser';

      const maxGroupsAllowed = GROUP_SLOTS_CONFIGS.reduce((amount, slot) => {
         amount += slot.amount ?? 1;
         return amount;
      }, 0);

      // This map creates group candidates with each slot using the amount value
      const groupCandidates = GROUP_SLOTS_CONFIGS.map(slot => {
         const result: GroupCandidate[] = [];
         // We create one more group than what is allowed
         const groupsToCreate: number = (slot.amount ?? 1) + 1;

         for (let i = 0; i < groupsToCreate; i++) {
            const groupCandidate = GroupCandTestTools.createGroupCandidate({
               amountOfInitialUsers: (slot.maximumSize ?? MAX_GROUP_SIZE) - 1,
               connectAllWithAll: true,
            });
            // We add the user to each group
            result.push(
               GroupCandTestTools.createAndAddOneUser({
                  group: groupCandidate,
                  connectWith: 'all',
                  userId: testUserId,
               }),
            );
         }
         return result;
      }).flat();

      // Create the full users
      for (const groupCandidate of groupCandidates) {
         await createFullUsersFromGroupCandidate(groupCandidate);
      }

      // Create the group
      await callGroupFinder();

      const testUserGroups: Group[] = await retrieveFinalGroupsOf([testUserId]);
      const allGroups: Group[] = await retrieveFinalGroupsOf(groupCandidates.map(g => g.users).flat());

      expect(testUserGroups).toHaveLength(maxGroupsAllowed);
      expect(allGroups).toHaveLength(groupCandidates.length);
   });

   afterEach(async () => {
      await queryToRemoveGroups(getAllTestGroupsCreated());
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
