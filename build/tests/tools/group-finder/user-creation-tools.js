"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmallerSlot = exports.getAllTestGroupsCreated = exports.retrieveFinalGroupsOf = exports.callGroupFinder = exports.createFullUsersFromGroupCandidate = void 0;
const js_tools_1 = require("../../../common-tools/js-tools/js-tools");
const models_1 = require("../../../components/groups-finder/models");
const models_2 = require("../../../components/groups/models");
const models_3 = require("../../../components/user/models");
const user_1 = require("../../../shared-tools/endpoints-interfaces/user");
const replacements_1 = require("../replacements");
const _experimental_1 = require("../_experimental");
const configurations_1 = require("../../../configurations");
const testGroupsCreated = [];
/**
 * Converts group candidate users into full users connected between them as they
 * are connected in the group candidate.
 *
 * @param useMultithreading When this is true users are created without checking for duplication be aware of that
 */
async function createFullUsersFromGroupCandidate(group, useMultithreading = false) {
    const usersCreated = [];
    const creationPromises = group.users.map(u => async () => usersCreated.push(await (0, _experimental_1.createFakeUser2)({ userId: u.userId, token: u.userId }, useMultithreading)));
    // Once all users are created we can connect the users
    const attractionPromises = group.users.map(user => async () => await (0, models_3.setAttractionPost)({
        token: user.userId,
        attractions: user.matches.map(userId => ({ userId, attractionType: user_1.AttractionType.Like })),
    }, replacements_1.fakeCtx));
    await (0, js_tools_1.executePromises)(creationPromises, useMultithreading);
    // This is not thread safe in any DB for the moment
    await (0, js_tools_1.executePromises)(attractionPromises, false);
    return usersCreated;
}
exports.createFullUsersFromGroupCandidate = createFullUsersFromGroupCandidate;
async function callGroupFinder(times = 3) {
    let groupsCreated = [];
    for (let i = 0; i < times; i++) {
        groupsCreated = [...groupsCreated, ...(await (0, models_1.searchAndCreateNewGroups)())];
    }
    testGroupsCreated.push(...groupsCreated);
    return groupsCreated;
}
exports.callGroupFinder = callGroupFinder;
/**
 * Gets the final groups created with users from a group candidate or a string list with ids.
 */
async function retrieveFinalGroupsOf(groupCandidateUsers) {
    const result = [];
    for (const user of groupCandidateUsers) {
        const token = typeof user === "string" ? user : user.userId;
        // userId and token are the same in these tests
        const userGroups = await (0, models_2.userGroupsGet)({ token }, replacements_1.fakeCtx, true);
        userGroups.forEach(userGroup => {
            if (result.find(g => g.groupId === userGroup.groupId) == null) {
                result.push(userGroup);
            }
        });
    }
    return result;
}
exports.retrieveFinalGroupsOf = retrieveFinalGroupsOf;
function getAllTestGroupsCreated() {
    return testGroupsCreated;
}
exports.getAllTestGroupsCreated = getAllTestGroupsCreated;
function getSmallerSlot() {
    return configurations_1.GROUP_SLOTS_CONFIGS.reduce((previous, current) => {
        var _a, _b;
        if ((_b = (_a = current.maximumSize) !== null && _a !== void 0 ? _a : configurations_1.MAX_GROUP_SIZE < previous.maximumSize) !== null && _b !== void 0 ? _b : configurations_1.MAX_GROUP_SIZE) {
            return current;
        }
        return previous;
    }, configurations_1.GROUP_SLOTS_CONFIGS[0]);
}
exports.getSmallerSlot = getSmallerSlot;
//# sourceMappingURL=user-creation-tools.js.map