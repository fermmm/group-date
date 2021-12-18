"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupUniqueHash = exports.dedupGroupCandidates = exports.reportPossibleDataCorruption = exports.getBestGroup = exports.getDataCorruptionProblemsInMultipleGroupCandidates = exports.getDataCorruptionProblemsInGroupCandidate = exports.userIsPresentOnGroup = exports.groupHasMinimumQuality = exports.groupSizeIsUnderMinimum = exports.analiceGroupCandidate = exports.removeExceedingConnectionsOnGroupCandidate = exports.getConnectionsMetaconnectionsDistance = exports.getAverageConnectionsAmount = exports.getConnectionsCoverageAverage = exports.getConnectionsCountInequalityLevel = void 0;
const js_tools_1 = require("../../../common-tools/js-tools/js-tools");
const general_1 = require("../../../common-tools/math-tools/general");
const configurations_1 = require("../../../configurations");
const models_1 = require("../models");
const group_candidate_editing_1 = require("./group-candidate-editing");
const ts_tools_1 = require("../../../common-tools/ts-tools/ts-tools");
/**
 * This function calculates the connections count inequality level with the following logic:
 *
 * Given a set of numbers gets the inequality between them using the formula:
 * "All element's distance from the mean" divided by "maximum possible distance"
 *
 * Examples:
 *
 *    [6,0,0] returns: 1 (total inequality)
 *    [3,3,3] returns: 0 (total equality)
 *    [0,5,1] returns: 0.75
 */
function getConnectionsCountInequalityLevel(group) {
    const connectionsCount = group.users.map(user => user.matches.length);
    const lessEqualCase = getLessEqualCase(connectionsCount);
    const deviation = meanAbsoluteDeviation(connectionsCount);
    const maximumDeviation = meanAbsoluteDeviation(lessEqualCase);
    let result = deviation / maximumDeviation;
    result = general_1.replaceNaNInfinity(result, 0);
    return result;
}
exports.getConnectionsCountInequalityLevel = getConnectionsCountInequalityLevel;
/**
 * An average of how many connections each user has divided by the total amount of users.
 * Gives an idea of how connected are the users with the rest of the group with a number from 0 to 1.
 */
function getConnectionsCoverageAverage(group) {
    return (group.users.reduce((s, u) => 
    // Each user can connect with the total amount of users - 1 (itself)
    (s += u.matches.length / (group.users.length - 1)), 0) / group.users.length);
}
exports.getConnectionsCoverageAverage = getConnectionsCoverageAverage;
/**
 * The sum of the amount of connections each user has divided by the total users.
 * Gives an idea of how valuable is a group for their users in terms of amount of connections.
 * The returned value is not normalized, higher value is better group quality.
 */
function getAverageConnectionsAmount(group) {
    return group.users.reduce((s, v) => (s += v.matches.length), 0) / group.users.length;
}
exports.getAverageConnectionsAmount = getAverageConnectionsAmount;
/**
 * Metaconnections = The connections of your connections.
 * This functions returns The numeric distance between the connections of a user an the metaconnections amount.
 * The result is then normalized in a range between 0 and 1.
 * In other words this functions returns: "How much people I connect with and how much other people I have to
 * "share" my connections".
 *
 * The number goes from 0 to 1. As higher it is the value the worst is the quality of the group.
 * This is the most important indicator of the quality of a group.
 */
function getConnectionsMetaconnectionsDistance(group) {
    const result = group.users.reduce((s, distance1) => {
        const distance1ConnectionsAmount = getMetaconnectionsAmountInGroupCandidate(group, distance1);
        let distancesForUser = 0;
        distance1ConnectionsAmount.forEach(distance2Amount => (distancesForUser += Math.abs(distance1.matches.length - distance2Amount)));
        let distance = distancesForUser / distance1.matches.length;
        /**
         * When a user has 0 connections the result is Infinity. We should not replace that infinity with 0
         * because 0 is the "healthiest" result, that's the opposite of what we have in this case. So in case
         * of no connections the distance is the whole group size.
         */
        distance = general_1.replaceNaNInfinity(distance, group.users.length);
        s += distance;
        return s;
    }, 0);
    return result / group.users.length / group.users.length;
}
exports.getConnectionsMetaconnectionsDistance = getConnectionsMetaconnectionsDistance;
function sum(array) {
    let num = 0;
    for (let i = 0, l = array.length; i < l; i++) {
        num += array[i];
    }
    return num;
}
function mean(array) {
    return sum(array) / array.length;
}
function getLessEqualCase(array) {
    const max = sum(array);
    return array.map((num, i) => (i === 0 ? max : 0));
}
function meanAbsoluteDeviation(array) {
    const arrayMean = mean(array);
    return mean(array.map(num => {
        return Math.abs(num - arrayMean);
    }));
}
/**
 * Returns a list with the amount of connections that has each of the users at distance 1 from a given user.
 */
function getMetaconnectionsAmountInGroupCandidate(group, targetUser) {
    return targetUser.matches.map(userDist1Id => group_candidate_editing_1.getUserByIdOnGroupCandidate(group, userDist1Id).matches.length);
}
/**
 * In a group candidate removes the exceeding connections of a user when there are more than the
 * maximum specified.
 */
function removeExceedingConnectionsOnGroupCandidate(group, maxConnectionsAllowed) {
    const resultGroup = group_candidate_editing_1.copyGroupCandidate(group);
    resultGroup.users.forEach((user, i) => {
        if (user.matches.length > maxConnectionsAllowed) {
            for (let u = user.matches.length - 1; u >= maxConnectionsAllowed; u--) {
                const userToDisconnect = group_candidate_editing_1.getUserByIdOnGroupCandidate(resultGroup, user.matches[u]);
                group_candidate_editing_1.disconnectUsers(user, userToDisconnect);
            }
        }
    });
    return resultGroup;
}
exports.removeExceedingConnectionsOnGroupCandidate = removeExceedingConnectionsOnGroupCandidate;
/**
 * Returns an object that contains the group and also contains values that are the result
 * of analyzing different features of the group as quality indicators.
 * "Quality" in a group means the amount of connections and their distribution level.
 */
function analiceGroupCandidate(group) {
    const groupTrimmed = removeExceedingConnectionsOnGroupCandidate(group, configurations_1.MAX_CONNECTIONS_POSSIBLE_IN_REALITY);
    const quality = getConnectionsMetaconnectionsDistance(group);
    const qualityRounded = general_1.roundDecimals(quality);
    const averageConnectionsAmount = getAverageConnectionsAmount(groupTrimmed);
    const averageConnectionsAmountRounded = Math.round(getAverageConnectionsAmount(groupTrimmed));
    return {
        group,
        analysis: { quality, qualityRounded, averageConnectionsAmount, averageConnectionsAmountRounded },
        analysisId: general_1.generateNumberId(), // Required by BST to not take same analysis numbers as the same object
    };
}
exports.analiceGroupCandidate = analiceGroupCandidate;
function groupSizeIsUnderMinimum(groupSize, slotIndex) {
    var _a;
    return groupSize < ((_a = configurations_1.GROUP_SLOTS_CONFIGS[slotIndex].minimumSize) !== null && _a !== void 0 ? _a : configurations_1.MIN_GROUP_SIZE);
}
exports.groupSizeIsUnderMinimum = groupSizeIsUnderMinimum;
function groupHasMinimumQuality(group) {
    return configurations_1.MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= group.analysis.quality;
}
exports.groupHasMinimumQuality = groupHasMinimumQuality;
function userIsPresentOnGroup(group, userId) {
    return group.users.findIndex(u => u.userId === userId) !== -1;
}
exports.userIsPresentOnGroup = userIsPresentOnGroup;
/**
 * Returns a list of strings describing data corruption problems in a group candidate. To be used
 * when testing code. This checks:
 *
 * - All the matches of a user should be present in a group, check for all the users of the group
 * - Matched users should be present in both matches list, unilateral matches are data corruption
 * - Users with 0 matches should not be allowed to be on a group
 * - Users should not have the same match more than once
 * - Users should not have more matches than the amount of members in the group
 * - A user cannot have his own id on the matches list
 * - A user or a match cannot be more than once
 */
function getDataCorruptionProblemsInGroupCandidate(group, maxUsersAllowed = null) {
    const result = [];
    const gr = ts_tools_1.checkTypeByMember(group, "group") ? group.group : group;
    if (maxUsersAllowed != null && gr.users.length > maxUsersAllowed) {
        result.push(`Group has too many users: Users amount: ${gr.users.length} max users to throw this error: ${maxUsersAllowed} groupId: ${gr.groupId}`);
    }
    const evaluatedUser = new Set();
    gr.users.forEach(u => {
        if (evaluatedUser.has(u.userId)) {
            result.push(`User is repeated: ${u.userId}`);
        }
        evaluatedUser.add(u.userId);
        if (u.matches == null) {
            result.push(`User matches array is null: ${u.userId}`);
        }
        if (u.matches.length === 0) {
            result.push(`Has user with 0 matches: ${u.userId}`);
        }
        if (u.matches.length > gr.users.length) {
            result.push(`User has more matches than members in the group: ${u.userId}`);
        }
        const evaluatedMatch = new Set();
        u.matches.forEach(m => {
            if (evaluatedMatch.has(m)) {
                result.push(`User has a repeated match: User: ${u.userId} Match repeated: ${m}`);
            }
            evaluatedMatch.add(m);
            if (u.userId === m) {
                result.push(`User has himself on the matches list: ${u.userId}`);
            }
            if (!userIsPresentOnGroup(gr, m)) {
                result.push(`User has a match that is not present on the group: ${m}`);
                return;
            }
            if (group_candidate_editing_1.getUserByIdOnGroupCandidate(gr, m).matches.findIndex(um => um === u.userId) === -1) {
                result.push(`User has unilateral match, the user: ${u.userId} is not in the matches of ${m}`);
            }
        });
    });
    return result;
}
exports.getDataCorruptionProblemsInGroupCandidate = getDataCorruptionProblemsInGroupCandidate;
function getDataCorruptionProblemsInMultipleGroupCandidates(groups) {
    const result = [];
    groups.forEach((g) => {
        const problems = getDataCorruptionProblemsInGroupCandidate(g);
        if (problems.length > 0) {
            result.push(problems);
        }
    });
    return result;
}
exports.getDataCorruptionProblemsInMultipleGroupCandidates = getDataCorruptionProblemsInMultipleGroupCandidates;
/**
 * Compares the analysis of 2 groups and returns the one with best quality. If both groups have exactly the
 * same quality it returns the first one.
 */
function getBestGroup(group1, group2) {
    if (js_tools_1.objectsContentIsEqual(group1.analysis, group2.analysis)) {
        return group1;
    }
    const result = [group1, group2];
    result.sort(models_1.getSortFunction(false));
    return result[0];
}
exports.getBestGroup = getBestGroup;
function reportPossibleDataCorruption(groups) {
    if (configurations_1.REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER) {
        const problems = getDataCorruptionProblemsInMultipleGroupCandidates(groups);
        if (problems.length > 0) {
            const problems = getDataCorruptionProblemsInMultipleGroupCandidates(groups);
            consoleLog("Database problem! Returned corrupted data in group candidates:");
            consoleLog(problems);
            logToFile("Database problem! Returned corrupted data in group candidates: " + JSON.stringify(problems), "groupFinderProblems");
        }
    }
}
exports.reportPossibleDataCorruption = reportPossibleDataCorruption;
/**
 * Removes duplicated groups. Be aware that different order of members are taken as a different group, so you
 * need to make sure the groups comes pre-ordered before calling this.
 */
function dedupGroupCandidates(groupCandidates) {
    const evaluated = new Set();
    return groupCandidates.filter(group => {
        const hash = getGroupUniqueHash(group);
        if (!evaluated.has(hash)) {
            evaluated.add(hash);
            return true;
        }
        return false;
    });
}
exports.dedupGroupCandidates = dedupGroupCandidates;
function getGroupUniqueHash(group) {
    return group.users.reduce((ids, user) => ids + user.userId, "");
}
exports.getGroupUniqueHash = getGroupUniqueHash;
//# sourceMappingURL=group-candidate-analysis.js.map