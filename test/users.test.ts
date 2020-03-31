import 'jest';
import { removeUsers } from '../src/components/common/queries';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers } from './tools/users';

describe('Users', () => {
   const FAKE_USERS_AMMOUNT: number = 50;
   let fakeUsers: Array<Partial<User>>;

   beforeAll(async () => {
      fakeUsers = await createFakeUsers(FAKE_USERS_AMMOUNT);
   });

   test('Fake users are created', () => {
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMMOUNT);
   });

   test('Fake users profile is completed', () => {
      expect(fakeUsers[0].profileCompleted).toBe(true);
   });

   afterAll(async () => {
      await removeUsers(fakeUsers);
   });
});
