"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersDataMatches = exports.createdUsersMatchesFakeData = void 0;
const earl_1 = require("earl");
const thenby_1 = require("thenby");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
/**
 * Checks if the users created contains the information that was passed to create them. Also checks that both
 * arrays have the same size, so no user is missing.
 */
function createdUsersMatchesFakeData(createdUsers, dataUsed, alsoCheckOrder = false) {
    (0, earl_1.expect)(createdUsers).toHaveLength(dataUsed.length);
    if (!alsoCheckOrder) {
        createdUsers = [...createdUsers];
        dataUsed = [...dataUsed];
        const cmp = new Intl.Collator().compare;
        createdUsers.sort((0, thenby_1.firstBy)("userId", { cmp }));
        dataUsed.sort((0, thenby_1.firstBy)("userId", { cmp }));
    }
    for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        const userData = dataUsed[i];
        (0, earl_1.expect)(usersDataMatches(user, userData)).toEqual(true);
    }
}
exports.createdUsersMatchesFakeData = createdUsersMatchesFakeData;
function usersDataMatches(user1, user2) {
    return (0, js_tools_1.objectsContentIsEqual)(user1, user2);
}
exports.usersDataMatches = usersDataMatches;
//# sourceMappingURL=reusable-tests.js.map