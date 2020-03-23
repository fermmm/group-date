import 'jest';
import '../src';
import { waitForDatabase } from '../src/common-tools/database-tools/database-manager';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers } from './tools/users';
jest.setTimeout(30000);

const FAKE_USERS_AMMOUNT: number = 80;
const SEED: number = 666;
let fakeUsers: Array<Partial<User>>;

beforeAll(async done => {
   await waitForDatabase();
   fakeUsers = await createFakeUsers(FAKE_USERS_AMMOUNT, SEED);
   done();
});

describe('Fake users creation', () => {
   test('Fake users are created', () => {
      console.log(fakeUsers.length);
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMMOUNT);
   });
   test('Fake users profile is completed', () => {
      expect(fakeUsers[0].profileCompleted).toBe(true);
   });
});
