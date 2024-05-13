"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmallerGroup = exports.getBiggestGroup = exports.connectUsersInChain = exports.matchUsersWithUsers = exports.matchUserWithUsers = exports.createMatchingUsers = void 0;
const generalTools_1 = require("./generalTools");
const users_1 = require("./users");
/**
 * Creates a group of users that are matching between them. You can set the minimum and maximum
 * of matches per user. If this is not set all users matches with all users.
 * @param amount Amount of users to create
 * @param settings Example {connectionsPerUser: {min: 0, max: 3}}
 */
async function createMatchingUsers(amount, settings) {
    const users = await (0, users_1.createFakeUsers)(amount);
    if ((settings === null || settings === void 0 ? void 0 : settings.connectionsPerUser) == null) {
        await (0, users_1.setAttractionAllWithAll)(users);
        return users;
    }
    for (const user of users) {
        const amountOfUsersToMatch = generalTools_1.chance.integer(settings.connectionsPerUser);
        if (amountOfUsersToMatch === 0) {
            continue;
        }
        const usersToMatch = generalTools_1.chance.pickset(users, amountOfUsersToMatch);
        await (0, users_1.setAttractionMatch)(user, usersToMatch);
    }
    return users;
}
exports.createMatchingUsers = createMatchingUsers;
/**
 * Matches a user with random users from a users list. You can also set the amount of matches to create.
 * If you don't set the amount of matches then it will match all users of the group.
 * Returns the users that were matched in case that is needed.
 */
async function matchUserWithUsers(user, usersToMatch, amountOfUsersToMatch) {
    amountOfUsersToMatch = amountOfUsersToMatch !== null && amountOfUsersToMatch !== void 0 ? amountOfUsersToMatch : usersToMatch.length;
    const users = generalTools_1.chance.pickset(usersToMatch, amountOfUsersToMatch);
    await (0, users_1.setAttractionMatch)(user, users);
    return users;
}
exports.matchUserWithUsers = matchUserWithUsers;
/**
 * Matches 2 lists of users together. You can set an amount of connections per user, if this is not set
 * all users from the list 1 will be connected with all the users from the list 2.
 * returns the users of both groups in case is needed.
 */
async function matchUsersWithUsers(usersList1, usersList2, connectionsPerUser, seed) {
    for (const userFromList1 of usersList1) {
        await matchUserWithUsers(userFromList1, usersList2, connectionsPerUser);
    }
    return [...usersList1, ...usersList2];
}
exports.matchUsersWithUsers = matchUsersWithUsers;
/**
 * Match users in a chain, so all users have 2 matches except the first and last users that have 1 match.
 * @param connectTheEnds Connect the first user with the last one, forming like a circle group. Default = false
 */
async function connectUsersInChain(users, connectTheEnds = false) {
    for (let i = 0; i < users.length; i++) {
        if (i === 0) {
            continue;
        }
        await (0, users_1.setAttractionMatch)(users[i], [users[i - 1]]);
        if (i === users.length - 1 && connectTheEnds) {
            await (0, users_1.setAttractionMatch)(users[i], [users[0]]);
        }
    }
}
exports.connectUsersInChain = connectUsersInChain;
function getBiggestGroup(groupCandidates) {
    return groupCandidates.reduce((result, group) => {
        if (result == null || group.members.length > result.members.length) {
            return group;
        }
        return result;
    }, null);
}
exports.getBiggestGroup = getBiggestGroup;
function getSmallerGroup(groupCandidates) {
    return groupCandidates.reduce((result, group) => {
        if (result == null || group.members.length < result.members.length) {
            return group;
        }
        return result;
    }, null);
}
exports.getSmallerGroup = getSmallerGroup;
//# sourceMappingURL=groups.js.map