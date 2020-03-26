import 'jest';
import '../src';
import { waitForDatabase } from '../src/common-tools/database-tools/database-manager';
import { User } from '../src/shared-tools/endpoints-interfaces/user';
import { createFakeUsers } from './tools/users';
jest.setTimeout(60 * 60 * 1000);

const FAKE_USERS_AMMOUNT: number = 500;
let fakeUsers: Array<Partial<User>>;

beforeAll(async done => {
   await waitForDatabase();
   fakeUsers = await createFakeUsers(FAKE_USERS_AMMOUNT);
   done();
});

describe('Fake users creation', () => {
   test('Fake users are created', () => {
      expect(fakeUsers).toHaveLength(FAKE_USERS_AMMOUNT);
   });
   test('Fake users profile is completed', () => {
      expect(fakeUsers[0].profileCompleted).toBe(true);
   });
});
