import "mocha";
import { expect } from "earl";
import { initAppForTests } from "./tools/beforeAllTests";
import { queryToRemoveUsers } from "../components/user/queries";
import { createFakeUser, generateRandomUserProps, getAllTestUsersCreated } from "./tools/users";
import { User } from "../shared-tools/endpoints-interfaces/user";

/**
 * This test file is really not testing anything, it's a boilerplate when you create a new test file
 * you copy this file and add more stuff.
 */
describe("Boilerplate test example", () => {
   let fakeUser: User;

   before(async () => {
      await initAppForTests();

      // Just an example of something you can do in a test file
      fakeUser = await createFakeUser({
         ...generateRandomUserProps(),
         name: "example user",
      });
   });

   it("Example", async () => {
      expect(fakeUser.name).toEqual("example user");
   });

   after(async () => {
      await queryToRemoveUsers(getAllTestUsersCreated());
   });
});
