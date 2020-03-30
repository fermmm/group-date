import 'jest';
import { removeUsers } from '../src/components/common/queries';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers } from './tools/users';

describe('Users', () => {
   const FAKE_USERS_AMMOUNT: number = 100;
   let fakeUsers: Array<Partial<User>>;

   beforeAll(async done => {
      fakeUsers = await createFakeUsers(FAKE_USERS_AMMOUNT);
      done();
   });
   test('Fake users are created', () => {
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMMOUNT);
   });
   test('Fake users profile is completed', () => {
      expect(fakeUsers[0].profileCompleted).toBe(true);
   });
   afterAll(async done => {
      await removeUsers(fakeUsers);
      done();
   });
});
