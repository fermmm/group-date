"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsIndexesOrdered = exports.getSortFunction = exports.analiceFilterAndSortGroupCandidates = exports.searchAndCreateNewGroups = exports.initializeGroupsFinder = void 0;
const configurations_1 = require("../../configurations");
const Collections = require("typescript-collections");
const thenby_1 = require("thenby");
const queries_1 = require("./queries");
const data_conversion_1 = require("./tools/data-conversion");
const group_candidate_analysis_1 = require("./tools/group-candidate-analysis");
const types_1 = require("./tools/types");
const dynamic_1 = require("set-interval-async/dynamic");
const models_1 = require("../groups/models");
const group_candidate_editing_1 = require("./tools/group-candidate-editing");
const group_candidate_editing_2 = require("./tools/group-candidate-editing");
const queries_2 = require("../user/queries");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const queries_3 = require("../groups/queries");
const measureTime_1 = require("../../common-tools/js-tools/measureTime");
const log_1 = require("../../common-tools/log-tool/log");
const types_2 = require("../../common-tools/log-tool/types");
async function initializeGroupsFinder() {
    (0, dynamic_1.setIntervalAsync)(searchAndCreateNewGroups, configurations_1.SEARCH_GROUPS_FREQUENCY);
}
exports.initializeGroupsFinder = initializeGroupsFinder;
/**
 * Searches new groups and creates them. This is the core feature of the app.
 * Also searches for users available to be added to recently created groups that are still open for more users.
 */
async function searchAndCreateNewGroups() {
    let groupsCreated = [];
    let groupsModified = [];
    /**
     * A user becomes unavailable after entering into a group, we need to store users that entered into a group
     * to not include them in the following iterations.
     * Each slot needs to have it's own list of not available users.
     */
    const notAvailableUsersBySlot = configurations_1.GROUP_SLOTS_CONFIGS.map(() => new Set());
    // Prepare qualities to search
    const qualitiesToSearch = [];
    qualitiesToSearch.push(types_1.GroupQuality.Good);
    if (configurations_1.SEARCH_BAD_QUALITY_GROUPS) {
        qualitiesToSearch.push(types_1.GroupQuality.Bad);
    }
    (0, measureTime_1.measureTime)("groupFinderTask");
    // For each quality and slot search for users that can form a group and create the groups
    for (const quality of qualitiesToSearch) {
        for (const slotIndex of slotsIndexesOrdered()) {
            groupsCreated.push(...(await createGroupsForSlot(slotIndex, quality, notAvailableUsersBySlot[slotIndex])));
        }
    }
    // For each quality and slot search for users available to be added to recently created groups that are still open for more users.
    for (const quality of qualitiesToSearch) {
        for (const slotIndex of slotsIndexesOrdered()) {
            groupsModified.push(...(await addMoreUsersToRecentGroups(slotIndex, quality, notAvailableUsersBySlot[slotIndex])));
        }
    }
    (0, log_1.log)({
        message: `Group finder finished, created ${groupsCreated.length} groups. Modified ${groupsModified.length} groups`,
        timeItTookMs: (0, measureTime_1.finishMeasureTime)("groupFinderTask"),
    }, types_2.LogId.GroupFinderTasks);
    return groupsCreated;
}
exports.searchAndCreateNewGroups = searchAndCreateNewGroups;
async function createGroupsForSlot(slot, quality, notAvailableUsers) {
    const groupsCreated = [];
    let groupsFromDatabase = [];
    /**
     * Call the group finding query
     */
    if (configurations_1.SINGLE_QUERY_GROUP_FINDER) {
        groupsFromDatabase = await (0, data_conversion_1.fromQueryToGroupCandidates)((0, queries_1.queryToGetGroupCandidates)(slot, quality));
    }
    else {
        // To not exceed the maximum time for a single query send one request to the database per user
        const usersToSearchIds = (await (0, queries_1.queryToGetUsersAllowedToBeOnGroups)(slot, quality)
            .values("userId")
            .toList());
        const databaseRequests = [];
        for (const userId of usersToSearchIds) {
            databaseRequests.push(async () => {
                groupsFromDatabase.push(...(await (0, data_conversion_1.fromQueryToGroupCandidates)((0, queries_1.queryToGetGroupCandidates)(slot, quality, (0, queries_2.queryToGetUserById)(userId)))));
            });
        }
        await (0, js_tools_1.executePromises)(databaseRequests, configurations_1.ENABLE_MULTITHREADING_IN_GROUP_FINDER);
        // Remove duplicates
        groupsFromDatabase = (0, group_candidate_analysis_1.dedupGroupCandidates)(groupsFromDatabase);
    }
    /**
     * Analice, filter and get a BST with group candidates sorted by quality
     */
    const groupCandidatesSorted = analiceFilterAndSortGroupCandidates(groupsFromDatabase, slot);
    let iterations = groupCandidatesSorted.size();
    /**
     * Loop all the groups and create them if possible, if not, fix them, reorder after
     * fix and try to create again if possible.
     */
    for (let i = 0; i < iterations; i++) {
        let group = groupCandidatesSorted.minimum();
        if (group == null) {
            break;
        }
        groupCandidatesSorted.remove(group);
        const notAvailableUsersOnGroup = getNotAvailableUsersOnGroup(group, notAvailableUsers);
        /**
         * If everything is fine with the group candidate then create the final group, if not, try to fix it and
         * add the fixed copy to groupCandidates BST list so it gets ordered by quality again and evaluated again.
         */
        if (notAvailableUsersOnGroup.length === 0 && group.group.users.length <= configurations_1.MAX_GROUP_SIZE) {
            const usersIds = group.group.users.map(u => u.userId);
            setUsersAsNotAvailable(usersIds, notAvailableUsers);
            const groupCreated = await (0, models_1.createGroup)({ usersIds, slotToUse: slot }, quality);
            groupsCreated.push(groupCreated);
        }
        else {
            group = (0, group_candidate_editing_1.removeUnavailableUsersFromGroup)(group, notAvailableUsersOnGroup, slot);
            if (group == null) {
                continue;
            }
            group = (0, group_candidate_editing_1.limitGroupToMaximumSizeIfNeeded)(group, slot);
            if (group == null) {
                continue;
            }
            // Check the quality of the group after all the changes
            if (!(0, group_candidate_analysis_1.groupHasMinimumQuality)(group)) {
                group = (0, group_candidate_editing_1.tryToFixBadQualityGroupIfNeeded)(group, slot);
                if (group == null) {
                    continue;
                }
            }
            /*
               At this point the new group is safe to be added to the list being iterated here in it's
               corresponding order to be checked again in one of the next iterations of this for-loop
            */
            groupCandidatesSorted.add(group);
            // We increase the iteration of this for-loop since we added an extra item
            iterations++;
        }
    }
    return groupsCreated;
}
/**
 * Adds more users to groups recently created that are still receiving users. Only adds the users if the addition
 * does not have a negative impact on the quality of the group.
 * Returns a list of group ids with the groups that were modified.
 */
async function addMoreUsersToRecentGroups(slotIndex, quality, notAvailableUsers) {
    const groupsModified = [];
    let groupsReceivingUsers = [];
    /**
     * Call the database
     */
    if (configurations_1.SINGLE_QUERY_GROUP_FINDER) {
        groupsReceivingUsers = await (0, data_conversion_1.fromQueryToGroupsReceivingNewUsers)((0, queries_1.queryToGetUsersToAddInRecentGroups)(slotIndex, quality));
    }
    else {
        // To not exceed the maximum time for a single query send one request to the database per group
        const groupsIds = (await (0, queries_1.queryToGetGroupsReceivingMoreUsers)(slotIndex, quality)
            .values("groupId")
            .toList());
        const databaseRequests = [];
        for (const groupId of groupsIds) {
            databaseRequests.push(async () => {
                groupsReceivingUsers.push(...(await (0, data_conversion_1.fromQueryToGroupsReceivingNewUsers)((0, queries_1.queryToGetUsersToAddInRecentGroups)(slotIndex, quality, (0, queries_3.queryToGetGroupById)(groupId)))));
            });
        }
        await (0, js_tools_1.executePromises)(databaseRequests, configurations_1.ENABLE_MULTITHREADING_IN_GROUP_FINDER);
    }
    for (const groupReceiving of groupsReceivingUsers) {
        const groupsWithNewUser = new Collections.BSTreeKV(getSortFunction());
        const groupsWithNewUserUser = new Map();
        for (const userToAdd of groupReceiving.usersToAdd) {
            if (notAvailableUsers.has(userToAdd.userId)) {
                continue;
            }
            const groupWithNewUserAnalyzed = (0, group_candidate_analysis_1.analiceGroupCandidate)((0, group_candidate_editing_2.addUserToGroupCandidate)(groupReceiving, userToAdd));
            if (!(0, group_candidate_analysis_1.groupHasMinimumQuality)(groupWithNewUserAnalyzed)) {
                continue;
            }
            const groupAnalyzed = (0, group_candidate_analysis_1.analiceGroupCandidate)(groupReceiving);
            // If the group quality decreases when adding the new user then ignore the user
            if ((0, group_candidate_analysis_1.getBestGroup)(groupWithNewUserAnalyzed, groupAnalyzed) === groupAnalyzed) {
                continue;
            }
            // Store the group containing the new user in a BST ordered by group quality
            groupsWithNewUser.add(groupWithNewUserAnalyzed);
            // Relate the group with the user to be retrieved later using this map
            groupsWithNewUserUser.set(groupWithNewUserAnalyzed, userToAdd.userId);
        }
        /**
         * This is adding only one user per group because adding another one requires to evaluate the impact of the
         * addition considering the other new users and that requires more of this iterations.
         */
        const bestGroupWithNewUser = groupsWithNewUser.minimum();
        const bestUserToAdd = groupsWithNewUserUser.get(bestGroupWithNewUser);
        if (bestUserToAdd != null) {
            await (0, models_1.addUsersToGroup)(groupReceiving.groupId, { usersIds: [bestUserToAdd], slotToUse: slotIndex });
            groupsModified.push(groupReceiving.groupId);
            notAvailableUsers.add(bestUserToAdd);
        }
    }
    return groupsModified;
}
function analiceFilterAndSortGroupCandidates(groups, slot) {
    // Group candidates are stored using a Binary Search Tree (BST) for better performance because many times we are going to be adding elements that should be ordered by quality
    const result = new Collections.BSTreeKV(getSortFunction());
    groups.forEach(group => {
        let groupAnalysed = (0, group_candidate_analysis_1.analiceGroupCandidate)(group);
        groupAnalysed = (0, group_candidate_editing_1.tryToFixBadQualityGroupIfNeeded)(groupAnalysed, slot);
        if (groupAnalysed == null) {
            return;
        }
        result.add(groupAnalysed);
    });
    return result;
}
exports.analiceFilterAndSortGroupCandidates = analiceFilterAndSortGroupCandidates;
/**
 * @param alsoSortByAnalysisId When passed to a BST this must be set to true. Default = true
 */
function getSortFunction(alsoSortByAnalysisId = true) {
    /**
     * The analysis numbers should be rounded to be the same number when are
     * close, this allows sub-ordering by another parameter.
     */
    let result;
    if (configurations_1.CREATE_BIGGER_GROUPS_FIRST) {
        // prettier-ignore
        result = (0, thenby_1.firstBy)(g => g.analysis.averageConnectionsAmountRounded, 'desc')
            .thenBy(g => g.analysis.quality, 'asc');
    }
    else {
        // prettier-ignore
        result = (0, thenby_1.firstBy)(g => g.analysis.qualityRounded, 'asc')
            .thenBy(g => g.analysis.averageConnectionsAmount, 'desc');
    }
    /**
     * analysisId is required by the Binary Search Tree to not take same analysis numbers as the same object,
     * BST does not allow duplications and when the sort function returns the same order for 2 elements then
     * the BST considers them as the same element, so an Id to still get a different order is required.
     */
    if (alsoSortByAnalysisId) {
        result = result.thenBy(g => g.analysisId);
    }
    return result;
}
exports.getSortFunction = getSortFunction;
function getNotAvailableUsersOnGroup(group, notAvailableUsers) {
    return group.group.users.reduce((result, user) => {
        if (notAvailableUsers.has(user.userId)) {
            result.push(user);
        }
        return result;
    }, []);
}
function setUsersAsNotAvailable(usersIds, notAvailableUsers) {
    usersIds.forEach(u => notAvailableUsers.add(u));
}
/**
 * Sorts slots so the bigger group slots first.
 */
function slotsIndexesOrdered() {
    const slotsSorted = [...configurations_1.GROUP_SLOTS_CONFIGS];
    const slotsWithIndex = slotsSorted.map((s, i) => ({ slot: s, index: i }));
    slotsWithIndex.sort((0, thenby_1.firstBy)(s => { var _a; return (_a = s.slot.minimumSize) !== null && _a !== void 0 ? _a : 0; }, "desc"));
    return slotsWithIndex.map(s => s.index);
}
exports.slotsIndexesOrdered = slotsIndexesOrdered;
//# sourceMappingURL=models.js.map