"use strict";
/**
 * The tools on this file should be used carefully. This is why:
 *
 * 1. Contains optimized versions of test tools that makes tests execution faster but can't
 *    support new features, so the tests may fail because of that.
 *
 * 2. This version of createFakeUsers creates many users on the same database request but seems to
 * be a limit in the amount of data per request, if this limit is passed the request never responds.
 * The solution is to call many requests of 40 users each. Performance and it's not much better than
 * one request per user but it seems to be multithreading safe.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTestUsersCreatedExperimental = exports.createFakeUser2 = exports.createFakeUsers2 = void 0;
const common_queries_1 = require("../../common-tools/database-tools/common-queries");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const users_1 = require("./users");
let fakeUsersCreated = [];
async function createFakeUsers2(amount, customParams, useMultithreading = false) {
    const usersCreated = [];
    js_tools_1.numberChunksCallback(amount, 40, async (amountForRequest) => {
        usersCreated.push(...(await generateAndCreateFakeUsers(amountForRequest, customParams, useMultithreading)));
    });
    return usersCreated;
}
exports.createFakeUsers2 = createFakeUsers2;
async function createFakeUser2(customParams, useMultithreading = false) {
    return (await generateAndCreateFakeUsers(1, customParams, useMultithreading))[0];
}
exports.createFakeUser2 = createFakeUser2;
async function generateAndCreateFakeUsers(amount, customParams, useMultithreading = false) {
    const users = [];
    const finalParams = { ...(customParams !== null && customParams !== void 0 ? customParams : {}) };
    if (amount > 1) {
        // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
        finalParams === null || finalParams === void 0 ? true : delete finalParams.userId;
        finalParams === null || finalParams === void 0 ? true : delete finalParams.token;
        finalParams === null || finalParams === void 0 ? true : delete finalParams.email;
    }
    for (let i = 0; i < amount; i++) {
        users.push(users_1.generateRandomUserProps(finalParams));
    }
    await database_manager_1.sendQuery(() => common_queries_1.queryToCreateVerticesFromObjects({
        objects: users,
        label: "user",
        duplicationAvoidanceProperty: !useMultithreading ? "userId" : null, // Checking for duplication is not supported in multithreading
    }).iterate());
    fakeUsersCreated.push(...users);
    return users;
}
function getAllTestUsersCreatedExperimental() {
    const result = [...fakeUsersCreated];
    fakeUsersCreated = [];
    return result;
}
exports.getAllTestUsersCreatedExperimental = getAllTestUsersCreatedExperimental;
//# sourceMappingURL=_experimental.js.map