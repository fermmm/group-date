"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersWithLessConnectionsThan = exports.getUsersWithLessConnections = exports.removeUnavailableUsersFromGroup = exports.removeUsersWithLessConnectionsUntil = exports.limitGroupToMaximumSizeIfNeeded = exports.tryToFixBadQualityGroupIfNeeded = exports.removeTheUserWithLessConnections = exports.removeUsersRecursivelyByConnectionsAmount = exports.removeUsersFromGroupCandidate = exports.disconnectUsers = exports.connectUsers = exports.getUsersFromGroupCandidateAsIndexList = exports.getUsersFromGroupCandidateAsIdList = exports.getUserByIdOnGroupCandidate = exports.addUserToGroupCandidate = exports.copyGroupCandidate = void 0;
const group_candidate_analysis_1 = require("./group-candidate-analysis");
const configurations_1 = require("../../../configurations");
const string_tools_1 = require("../../../common-tools/string-tools/string-tools");
function copyGroupCandidate(group, keepSameId = true) {
    return {
        groupId: keepSameId ? group.groupId : string_tools_1.generateId(),
        users: group.users.map(u => ({ userId: u.userId, matches: [...u.matches] })),
    };
}
exports.copyGroupCandidate = copyGroupCandidate;
/**
 * Returns a new group candidate with the user added. The other users will connect with the new user
 * according to the matches of the new user, in other words ensures the connections are bi-directional.
 */
function addUserToGroupCandidate(group, user) {
    const resultGroup = copyGroupCandidate(group);
    user.matches.forEach(userMatch => getUserByIdOnGroupCandidate(resultGroup, userMatch).matches.push(user.userId));
    resultGroup.users.push(user);
    return resultGroup;
}
exports.addUserToGroupCandidate = addUserToGroupCandidate;
function getUserByIdOnGroupCandidate(groupCandidate, userId) {
    return groupCandidate.users.find(u => u.userId === userId);
}
exports.getUserByIdOnGroupCandidate = getUserByIdOnGroupCandidate;
/**
 * Gets the users of a group candidate but only the ids
 */
function getUsersFromGroupCandidateAsIdList(groupCandidate) {
    return groupCandidate.users.map(u => u.userId);
}
exports.getUsersFromGroupCandidateAsIdList = getUsersFromGroupCandidateAsIdList;
/**
 * Gets the users of a group candidate but only indexes to find them in the group candidate
 */
function getUsersFromGroupCandidateAsIndexList(groupCandidate) {
    return groupCandidate.users.map((u, i) => i);
}
exports.getUsersFromGroupCandidateAsIndexList = getUsersFromGroupCandidateAsIndexList;
/**
 * Adds the users to each other's match list. Also does checks to avoid duplication and self connections.
 */
function connectUsers(user1, user2) {
    if (user1.userId === user2.userId) {
        return;
    }
    if (user1.matches.indexOf(user2.userId) === -1) {
        user1.matches.push(user2.userId);
    }
    if (user2.matches.indexOf(user1.userId) === -1) {
        user2.matches.push(user1.userId);
    }
}
exports.connectUsers = connectUsers;
function disconnectUsers(user1, user2) {
    if (user1.matches.indexOf(user2.userId) !== -1) {
        user1.matches.splice(user1.matches.indexOf(user2.userId), 1);
    }
    if (user2.matches.indexOf(user1.userId) !== -1) {
        user2.matches.splice(user2.matches.indexOf(user1.userId), 1);
    }
}
exports.disconnectUsers = disconnectUsers;
function removeUsersFromGroupCandidate(group, usersToRemove) {
    const resultGroup = copyGroupCandidate(group);
    if (usersToRemove.length === 0) {
        return resultGroup;
    }
    usersToRemove.forEach(u => {
        // Get the user to be removed but take the reference from the new copy of the group
        const user = getUserByIdOnGroupCandidate(resultGroup, u.userId);
        // Disconnect the user from it's matches
        user.matches.forEach(matchUserId => {
            const matchUser = getUserByIdOnGroupCandidate(resultGroup, matchUserId);
            const indexInMatch = matchUser.matches.indexOf(user.userId);
            // Remove the user from the matches list of all other users
            matchUser.matches.splice(indexInMatch, 1);
        });
        // Remove the user from the group
        const userIndex = resultGroup.users.findIndex(usr => usr.userId === user.userId);
        resultGroup.users.splice(userIndex, 1);
        // The user should not have any matches becase it was removed from the group
        user.matches = [];
    });
    return resultGroup;
}
exports.removeUsersFromGroupCandidate = removeUsersFromGroupCandidate;
/**
 * Removes the users that have less connections than the amount specified in a recursive way:
 *
 * Because each removal can generate more users with lower connections the removal will repeat until
 * there are no more users to remove or the group has no more users.
 * So the resulting group will only have users with equal or more connections than the amount specified.
 */
function removeUsersRecursivelyByConnectionsAmount(group, connectionsAmount) {
    let resultGroup = copyGroupCandidate(group);
    const iterations = resultGroup.users.length;
    for (let i = 0; i < iterations; i++) {
        const usersToRemove = getUsersWithLessConnectionsThan(resultGroup, connectionsAmount);
        if (usersToRemove.length === 0 || resultGroup.users.length === 0) {
            return resultGroup;
        }
        resultGroup = removeUsersFromGroupCandidate(resultGroup, usersToRemove);
    }
    return resultGroup;
}
exports.removeUsersRecursivelyByConnectionsAmount = removeUsersRecursivelyByConnectionsAmount;
/**
 * Removes the first user that finds with less connections than the others, if all the users
 * have the same amount of connections removes the first user of the group.
 * When removing a user the others can become less connected than the minimum, these users
 * will be removed too so the minimum connections allowed should be passed to this function.
 */
function removeTheUserWithLessConnections(group, minimumConnectionsAllowed) {
    const lessConnectedUsers = getUsersWithLessConnections(group);
    let result = removeUsersFromGroupCandidate(group, [lessConnectedUsers[0]]);
    result = removeUsersRecursivelyByConnectionsAmount(result, minimumConnectionsAllowed);
    return result;
}
exports.removeTheUserWithLessConnections = removeTheUserWithLessConnections;
/**
 * Removes the users with less connections, that tends to improve the group quality. If the quality still
 * does not get over the minimum allowed or the group becomes too small for the slot, then null is returned
 */
function tryToFixBadQualityGroupIfNeeded(group, slot) {
    return removeUsersWithLessConnectionsUntil(group, slot, g => group_candidate_analysis_1.groupHasMinimumQuality(g));
}
exports.tryToFixBadQualityGroupIfNeeded = tryToFixBadQualityGroupIfNeeded;
/**
 * If the group has a size that is more than MAX_GROUP_SIZE then removes the users with less connections until
 * the number of members is equal to MAX_GROUP_SIZE. Returns a copy of the group with this procedure applied.
 * If the quality of the group is below minimum after this removal then null is returned.
 */
function limitGroupToMaximumSizeIfNeeded(group, slot) {
    return removeUsersWithLessConnectionsUntil(group, slot, g => g.group.users.length <= configurations_1.MAX_GROUP_SIZE);
}
exports.limitGroupToMaximumSizeIfNeeded = limitGroupToMaximumSizeIfNeeded;
/**
 * Removes one user from the group multiple times until the provided callback returns true,
 * More than one user could be removed at a time if removing a user generates another with
 * less connections than the minimum allowed.
 *
 * @param group The group to copy and return with users removed
 * @param slot The slot used
 * @param untilCallback A callback that passes the group with one or more less user each time and should return a boolean indicating to stop.
 */
function removeUsersWithLessConnectionsUntil(group, slot, untilCallback) {
    if (untilCallback(group) === true) {
        return group;
    }
    let result = copyGroupCandidate(group.group);
    const iterations = result.users.length;
    for (let i = 0; i < iterations; i++) {
        result = removeTheUserWithLessConnections(result, configurations_1.MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);
        if (group_candidate_analysis_1.groupSizeIsUnderMinimum(result.users.length, slot)) {
            return null;
        }
        const groupAnalysed = group_candidate_analysis_1.analiceGroupCandidate(result);
        if (untilCallback(groupAnalysed) === true) {
            return groupAnalysed;
        }
    }
    return null;
}
exports.removeUsersWithLessConnectionsUntil = removeUsersWithLessConnectionsUntil;
function removeUnavailableUsersFromGroup(group, notAvailableUsersOnGroup, slot) {
    // If the "not available" users amount is too much it can be discarded without trying to fix it
    if (group_candidate_analysis_1.groupSizeIsUnderMinimum(group.group.users.length - notAvailableUsersOnGroup.length, slot)) {
        return null;
    }
    // Create a new group candidate removing unavailable users
    let newGroup = removeUsersFromGroupCandidate(group.group, notAvailableUsersOnGroup);
    // After users are removed other users should also be removed if their connections amount are too low
    newGroup = removeUsersRecursivelyByConnectionsAmount(newGroup, configurations_1.MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);
    /**
     * After removing non available users if the group is not big enough it's ignored.
     * In the future more users might become available to complete the group or it will
     * be "eaten" by small group creations if the remaining users have free slots for
     * small groups
     */
    if (group_candidate_analysis_1.groupSizeIsUnderMinimum(newGroup.users.length, slot)) {
        return null;
    }
    return group_candidate_analysis_1.analiceGroupCandidate(newGroup);
}
exports.removeUnavailableUsersFromGroup = removeUnavailableUsersFromGroup;
/**
 * Returns the users with less connections or the first user if all has the same amount of connections
 */
function getUsersWithLessConnections(group) {
    return group.users.reduce((result, user) => {
        if (result.length === 0) {
            result = [user];
            return result;
        }
        if (user.matches.length === result[0].matches.length) {
            result.push(user);
            return result;
        }
        if (user.matches.length < result[0].matches.length) {
            result = [user];
            return result;
        }
        return result;
    }, []);
}
exports.getUsersWithLessConnections = getUsersWithLessConnections;
function getUsersWithLessConnectionsThan(group, connectionsAmount) {
    return group.users.reduce((result, user) => {
        if (user.matches.length < connectionsAmount) {
            result.push(user);
        }
        return result;
    }, []);
}
exports.getUsersWithLessConnectionsThan = getUsersWithLessConnectionsThan;
//# sourceMappingURL=group-candidate-editing.js.map