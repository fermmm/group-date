"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const earl_1 = require("earl");
const beforeAllTests_1 = require("./tools/beforeAllTests");
const queries_1 = require("../components/user/queries");
const users_1 = require("./tools/users");
/**
 * This test file is really not testing anything, it's a boilerplate when you create a new test file
 * you copy this file and add more stuff.
 */
describe("Boilerplate test example", () => {
    let fakeUser;
    before(async () => {
        await (0, beforeAllTests_1.initAppForTests)();
        // Just an example of something you can do in a test file
        fakeUser = await (0, users_1.createFakeUser)({
            ...(0, users_1.generateRandomUserProps)(),
            name: "example user",
        });
    });
    it("Example", async () => {
        (0, earl_1.expect)(fakeUser.name).toEqual("example user");
    });
    after(async () => {
        await (0, queries_1.queryToRemoveUsers)((0, users_1.getAllTestUsersCreated)());
    });
});
//# sourceMappingURL=boilerplate.test.js.map