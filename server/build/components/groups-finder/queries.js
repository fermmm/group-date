"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToGetUsersToAddInRecentGroups = exports.queryToGetGroupsReceivingMoreUsers = exports.queryToGetUsersAllowedToBeOnGroups = exports.queryToGetGroupCandidates = void 0;
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const configurations_1 = require("../../configurations");
const moment = require("moment");
const queries_1 = require("../user/queries");
const types_1 = require("./tools/types");
const configurations_2 = require("../../configurations");
/**
 * This query returns lists of users arrays where it's users matches between them.
 * This search is required to create new "group candidates" these groups candidates are later converted
 * into real groups. This is the core feature of the app.
 */
function queryToGetGroupCandidates(targetSlotIndex, quality, currentTraversal) {
    let traversal;
    switch (quality) {
        case types_1.GroupQuality.Good:
            traversal = queryToSearchGoodQualityMatchingGroups(targetSlotIndex, currentTraversal);
            break;
        case types_1.GroupQuality.Bad:
            traversal = queryToSearchBadQualityMatchingGroups(targetSlotIndex, currentTraversal);
            break;
    }
    traversal = queryToAddDetailsAndIgnoreInvalidSizes(traversal, configurations_1.GROUP_SLOTS_CONFIGS[targetSlotIndex]);
    return traversal;
}
exports.queryToGetGroupCandidates = queryToGetGroupCandidates;
/**
 * Receives a traversal with a list of users and only keeps the ones allowed to be on a new group
 * according to the given group slot.
 * If no traversal is provided then it will start with all complete users and then filter that list.
 */
function queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, quality, traversal) {
    /**
     * We should include incomplete users because the profile may be incomplete after a migration and the
     * user does not have the last changes. We check for matches so that filter too incomplete users.
     */
    traversal = traversal !== null && traversal !== void 0 ? traversal : (0, queries_1.queryToGetAllUsers)();
    traversal = traversal
        // Optimization. Discards all users that don't have matches.
        .where(database_manager_1.__.bothE("Match").count().is(database_manager_1.P.gt(1)))
        // Only users with not too many groups already active can be part of new group searches
        .where(database_manager_1.__.outE("slot" + targetSlotIndex)
        .count()
        .is(database_manager_1.P.lt(configurations_1.GROUP_SLOTS_CONFIGS[targetSlotIndex].amount)))
        // Don't introduce inactive users into the groups candidates.
        // Inactive means many time without login and no new users notifications pending
        .not(database_manager_1.__.has("lastLoginDate", database_manager_1.P.lt(moment().unix() - configurations_1.MAXIMUM_INACTIVITY_FOR_NEW_GROUPS))
        .and()
        .has("sendNewUsersNotification", database_manager_1.P.lt(1)))
        /**
         * User is not banned
         */
        .not(database_manager_1.__.has("banReasonsAmount", database_manager_1.P.gt(0)));
    if (quality === types_1.GroupQuality.Bad) {
        traversal = traversal.where(database_manager_1.__.values("lastGroupJoinedDate").is(database_manager_1.P.lt(moment().unix() - configurations_1.FORM_BAD_QUALITY_GROUPS_TIME)));
    }
    return traversal;
}
exports.queryToGetUsersAllowedToBeOnGroups = queryToGetUsersAllowedToBeOnGroups;
/**
 * Generates an anonymous traversal with a user and returns it's matches as long as the matches are users
 * allowed to be on groups
 */
function queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, quality) {
    return queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, quality, database_manager_1.__.both("Match"));
}
/**
 * This query finds users that matches together forming a group, it's the core query of the app.
 * Returns arrays of matching users.
 *
 * Users are grouped together following this logic:
 *
 * 1. A match and all the other matches in common (triangle shapes in a graph).
 * 2. A user that has at least 2 matches in common (square shapes in a graph).
 *
 * To test the query easily:
 * https://gremlify.com/28ks1qe9obji
 *
 * Old version with horrible performance:
 * https://gremlify.com/5lgbctob8n4
 */
function queryToSearchGoodQualityMatchingGroups(targetSlotIndex, currentTraversal) {
    const traversal = currentTraversal !== null && currentTraversal !== void 0 ? currentTraversal : queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Good);
    return (traversal
        .as("u")
        // Find groups
        .flatMap(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Good)
        // This avoids repetitions by avoiding same resulting inverse comparisons
        .flatMap(database_manager_1.__.union(
    // Find groups of connected triangles and couples (couples are useful to form squares)
    queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Good).where(database_manager_1.__.both("Match").as("u")), 
    // With the search below the starting user and the match are not added so we add it here
    database_manager_1.__.identity(), database_manager_1.__.select("u"))
        // Order the group members so later dedup() does not take different order in members as a different group
        .order()
        .by(database_manager_1.t.id)
        .fold()))
        .dedup()
        // Make a copy of the group (or merge) but this time include "square" shapes formed with 2 matching
        // users from the group and 2 matching users from outside of the group, this allows square
        // shapes, which is a characteristic of groups with heterosexual members and also in other attraction cases.
        .flatMap(database_manager_1.__.union(configurations_1.EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES ? database_manager_1.__.identity() : database_manager_1.__.union(), database_manager_1.__.union(database_manager_1.__.identity().unfold(), database_manager_1.__.identity()
        .as("group")
        .unfold()
        .as("groupMember")
        // Get match outside the group (union is used only to be able to call a function)
        .union(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Good))
        .not(database_manager_1.__.where(database_manager_1.P.within("group")))
        // But only matches that forms a square with 2 members of the group
        .where(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Good)
        .not(database_manager_1.__.where(database_manager_1.P.within("group")))
        .where(database_manager_1.__.both("Match").where(database_manager_1.P.within("group")).where(database_manager_1.P.neq("groupMember")))))
        .dedup()
        // Order the group members so later dedup() does not take different order in members as a different group
        .order()
        .by(database_manager_1.t.id)
        .fold()))
        .dedup());
}
/**
 * This query searches for matching users that are not so well connected so they can form a bad quality group.
 *
 * These groups are "circles" of users with 2 connections each, can be visualized as a round of
 * people.
 *
 * To test the query easily:
 * https://gremlify.com/o9rye6xy5od
 */
function queryToSearchBadQualityMatchingGroups(targetSlotIndex, currentTraversal) {
    const searches = [];
    for (let i = 5; i <= configurations_1.MAX_GROUP_SIZE; i++) {
        searches.push(database_manager_1.__.repeat(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Bad).simplePath())
            .times(i - 1)
            .where(database_manager_1.__.both("Match").as("a"))
            .path()
            .from_("a"));
    }
    const traversal = currentTraversal !== null && currentTraversal !== void 0 ? currentTraversal : queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, types_1.GroupQuality.Bad);
    return (traversal
        .as("a")
        // Find shapes
        .union(...searches)
        // Remove duplicates. Also ordering the users is needed here so dedup recognizes all the groups as the same one
        .map(database_manager_1.__.unfold().order().by(database_manager_1.t.id).dedup().fold())
        .dedup());
}
/**
 * Receives a traversal with a list of users arrays and for each user adds it's matches within the group. This extra
 * info is required by the group quality analyzer.
 * Groups sizes below minimum group size are discarded here.
 * Groups sizes over maximum slot size are ignored if there is a bigger slot available.
 * The query makes no action when the group is bigger than MAX_GROUP_SIZE, cutting the group must be done correctly
 * by the JS logic because the inconsistency left after removing a user (like a user with a single match left) must
 * be handled outside of Gremlin.
 *
 * To test the query easily:
 * https://gremlify.com/h1t3sapjlkc
 *
 *
 * @param slotSize Size restriction. This is not to limit the group size, it's for ignoring groups with sizes outside the limits passed.
 * @param returnNames Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsAndIgnoreInvalidSizes(traversal, slotSize) {
    var _a;
    return traversal.map(database_manager_1.__.where(database_manager_1.__.count(database_manager_1.scope.local)
        .is(database_manager_1.P.gte(configurations_1.MIN_GROUP_SIZE))
        .is(database_manager_1.P.gte((_a = slotSize === null || slotSize === void 0 ? void 0 : slotSize.minimumSize) !== null && _a !== void 0 ? _a : 0))
        .is(database_manager_1.P.lte(configurations_1.ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS === false && (slotSize === null || slotSize === void 0 ? void 0 : slotSize.maximumSize) != null
        ? slotSize.maximumSize
        : 99999)))
        .as("g")
        .unfold()
        .map(database_manager_1.__.project("userId", "matches")
        .by(database_manager_1.__.values("userId"))
        .by(database_manager_1.__.as("u")
        .both("Match")
        .where(database_manager_1.P.within("g")) // Get the matches of the user within the group
        .values("userId")
        .fold()))
        // This could be useful in the future to improve performance on JS side:
        // .order()
        // .by(__.select('matches').count(scope.local), order.desc) // Order the users by their amount of matches
        .fold()
        .choose(database_manager_1.__.count(database_manager_1.scope.local).is(database_manager_1.P.eq(0)), database_manager_1.__.unfold()));
}
function queryToGetGroupsReceivingMoreUsers(slotIndex, quality) {
    var _a, _b;
    return (database_manager_1.g
        .V()
        .hasLabel("group")
        // Active groups
        .where(database_manager_1.__.has("creationDate", database_manager_1.P.gt(moment().unix() - configurations_1.MAX_TIME_GROUPS_RECEIVE_NEW_USERS)))
        // Groups of the target quality. This prevents occupying slots of good quality capable users with low quality groups
        .where(database_manager_1.__.has("initialQuality", quality))
        // Groups that has space for more users and match the slot config passed
        .where(database_manager_1.__.in_("member")
        .count()
        .is(database_manager_1.P.lt(configurations_1.MAX_GROUP_SIZE)) // Not groups already full
        .is(database_manager_1.P.gte((_a = configurations_1.GROUP_SLOTS_CONFIGS[slotIndex].minimumSize) !== null && _a !== void 0 ? _a : configurations_1.MIN_GROUP_SIZE)) // Groups bigger than the minimum size in slot
        .is(database_manager_1.P.lte(configurations_1.ALLOW_SMALL_GROUPS_BECOME_BIG
        ? configurations_1.MAX_GROUP_SIZE
        : (_b = configurations_1.GROUP_SLOTS_CONFIGS[slotIndex].maximumSize) !== null && _b !== void 0 ? _b : configurations_1.MAX_GROUP_SIZE))));
}
exports.queryToGetGroupsReceivingMoreUsers = queryToGetGroupsReceivingMoreUsers;
/**
 * Returns a list of groups that are recently created so they still can receive new users along with a list of users
 * that can be added to each group. Also details of each group are included.
 * Active groups are open to adding new users as long as the new user has 2 matches within the members of the group.
 *
 * To play with this query:
 * https://gremlify.com/3hrqz4ijyvt
 */
function queryToGetUsersToAddInRecentGroups(slotIndex, quality, currentTraversal) {
    const traversal = currentTraversal !== null && currentTraversal !== void 0 ? currentTraversal : queryToGetGroupsReceivingMoreUsers(slotIndex, quality);
    return (
    // Get users to add to these groups
    traversal
        .project("group", "usersToAdd")
        .by()
        .by(
    // Find matches of the member group that are not members of the group
    database_manager_1.__.as("group")
        .in_("member")
        .both("Match")
        .not(database_manager_1.__.where(database_manager_1.__.out("member").as("group")))
        // Only include users allowed to be in new groups
        .union(queryToGetUsersAllowedToBeOnGroups(slotIndex, quality, database_manager_1.__))
        // Find the matches that the user has inside the group
        .group()
        .by(database_manager_1.__.values("userId"))
        .by(database_manager_1.__.both("Match").where(database_manager_1.__.out("member").as("group")).values("userId").dedup().fold())
        .unfold()
        .project("userId", "matches")
        .by(database_manager_1.column.keys)
        .by(database_manager_1.column.values)
        // Discard users with not enough connections amount
        .where(database_manager_1.__.select("matches").count(database_manager_1.scope.local).is(database_manager_1.P.gte(configurations_2.MINIMUM_CONNECTIONS_TO_BE_ON_GROUP)))
        .fold())
        // Discard groups with no users to add
        .where(database_manager_1.__.select("usersToAdd").unfold())
        // Re create the object we have at this point adding "groupMatches" with the members of the
        // group and their matches
        .project("groupId", "usersToAdd", "users")
        .by(database_manager_1.__.select("group").values("groupId"))
        .by(database_manager_1.__.select("usersToAdd"))
        .by(
    // Get members of the group and their matches (it does not include the possible new member)
    database_manager_1.__.select("group")
        .as("group")
        .in_("member")
        .project("userId", "matches")
        .by(database_manager_1.__.values("userId"))
        .by(database_manager_1.__.both("SeenMatch").where(database_manager_1.__.out("member").as("group")).values("userId").fold())
        .fold()));
}
exports.queryToGetUsersToAddInRecentGroups = queryToGetUsersToAddInRecentGroups;
//# sourceMappingURL=queries.js.map