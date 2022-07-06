"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToFindShouldBeInactiveGroups = exports.queryToRemoveGroups = exports.queryToGetGroupsInFinalFormat = exports.queryToGetGroupsToSendReminder = exports.queryToGetMembersForNewMsgNotification = exports.queryToGetReadMessagesAndTotal = exports.queryToUpdatedReadMessagesAmount = exports.queryToUpdateMembershipProperty = exports.queryToUpdateGroupProperty = exports.queryToGetAllGroups = exports.queryToGetAllGroupsOfUser = exports.queryToGetGroupById = exports.queryToVoteDateIdeas = exports.queryToFindSlotsToRelease = exports.queryToAddUsersToGroup = exports.queryToCreateGroup = void 0;
const moment = require("moment");
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const configurations_1 = require("../../configurations");
const types_1 = require("../groups-finder/tools/types");
const queries_1 = require("../user/queries");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
/**
 * Creates a group and returns it as a traversal query.
 * This function should not be called directly, use createGroup() to create groups.
 */
function queryToCreateGroup(params) {
    var _a, _b, _c;
    let initialChat = (0, data_conversion_tools_1.serializeIfNeeded)({
        messages: [],
    });
    initialChat = (0, data_conversion_tools_1.encodeIfNeeded)(initialChat, "chat", "group");
    let traversal = database_manager_1.g
        .addV("group")
        .property(database_manager_1.cardinality.single, "groupId", (0, string_tools_1.generateId)())
        .property(database_manager_1.cardinality.single, "chat", initialChat)
        .property(database_manager_1.cardinality.single, "chatMessagesAmount", 0)
        .property(database_manager_1.cardinality.single, "creationDate", moment().unix())
        .property(database_manager_1.cardinality.single, "membersAmount", (_b = (_a = params.initialUsers) === null || _a === void 0 ? void 0 : _a.usersIds.length) !== null && _b !== void 0 ? _b : 0)
        .property(database_manager_1.cardinality.single, "dayOptions", (0, data_conversion_tools_1.serializeIfNeeded)(params.dayOptions))
        .property(database_manager_1.cardinality.single, "initialQuality", (_c = params.initialQuality) !== null && _c !== void 0 ? _c : types_1.GroupQuality.Good)
        .property(database_manager_1.cardinality.single, "reminder1NotificationSent", false)
        .property(database_manager_1.cardinality.single, "reminder2NotificationSent", false)
        .property(database_manager_1.cardinality.single, "seenBy", (0, data_conversion_tools_1.serializeIfNeeded)([]))
        .property(database_manager_1.cardinality.single, "showRemoveSeenMenu", configurations_1.ALWAYS_SHOW_REMOVE_SEEN_MENU ? true : false)
        .property(database_manager_1.cardinality.single, "isActive", true);
    if (params.initialUsers != null) {
        traversal = queryToAddUsersToGroup(traversal, params.initialUsers);
    }
    return traversal;
}
exports.queryToCreateGroup = queryToCreateGroup;
/**
 * Receives a traversal that selects a group and adds users to the group, also returns the group vertex.
 * Also changes the "Match" edges between the members for new "SeenMatch" edges to be ignored by the group
 * finding algorithms avoiding repeated groups or groups with repeated matches.
 *
 * @param group The traversal that returns a group vertex.
 * @param usersIds The list of user ids to add to the group.
 * @param slotToUse The id of the slot that will be used on the users being added to the group. You can use getSlotIdFromUsersAmount() to get this value
 */
function queryToAddUsersToGroup(group, settings) {
    return (group
        .as("group")
        .sideEffect(database_manager_1.__.V()
        // Make queries selecting each user by the user id provided and add the member edge to the group
        .union(...settings.usersIds.map(u => database_manager_1.__.has("userId", u)))
        .sideEffect(database_manager_1.__.addE("member")
        .to("group")
        .property("newMessagesRead", true)
        .property("readMessagesAmount", 0))
        // Add the corresponding slot edge, slots avoids adding the users in too many groups
        .sideEffect(database_manager_1.__.addE("slot" + settings.slotToUse).to("group"))
        .sideEffect(database_manager_1.__.property(database_manager_1.cardinality.single, "lastGroupJoinedDate", moment().unix())))
        .property(database_manager_1.cardinality.single, "membersAmount", database_manager_1.__.inE("member").count())
        // Replace the "Match" edges between the members of the group by a "SeenMatch" edge in order to be ignored
        // by the group finding algorithms. This avoids repeated groups or groups with repeated matches.
        .sideEffect(database_manager_1.__.both("member")
        .bothE("Match")
        .where(database_manager_1.__.bothV().simplePath().both("member").where(database_manager_1.P.eq("group")))
        .dedup()
        .sideEffect(database_manager_1.__.addE("SeenMatch").from_(database_manager_1.__.inV()).to(database_manager_1.__.outV()))
        .drop()));
}
exports.queryToAddUsersToGroup = queryToAddUsersToGroup;
/**
 * Finds group slots that can be released and releases them. Removed the slot edge.
 * You can play with this query here: https://gremlify.com/t0km39qnpm
 */
function queryToFindSlotsToRelease() {
    return database_manager_1.g
        .E()
        .union(...configurations_1.GROUP_SLOTS_CONFIGS.map((slot, i) => database_manager_1.__.hasLabel("slot" + i).where(database_manager_1.__.inV()
        .values("creationDate")
        .is(database_manager_1.P.lt(moment().unix() - slot.releaseTime)))))
        .drop();
}
exports.queryToFindSlotsToRelease = queryToFindSlotsToRelease;
/**
 * Registers a vote to the date idea and returns the group vertex
 */
function queryToVoteDateIdeas(group, userId, usersIdsToVote) {
    let traversal = group
        .as("group")
        .V()
        .has("userId", userId)
        .as("user")
        .sideEffect(database_manager_1.__.outE("dateIdeaVote").where(database_manager_1.__.inV().as("group")).drop());
    usersIdsToVote.forEach(ideaUserId => (traversal = traversal.sideEffect(
    // cardinality.single is not used here because we are positioned in an edge
    database_manager_1.__.addE("dateIdeaVote").to("group").property("ideaOfUser", ideaUserId))));
    traversal = traversal.select("group");
    return traversal;
}
exports.queryToVoteDateIdeas = queryToVoteDateIdeas;
function queryToGetGroupById(groupId, filters) {
    let traversal = database_manager_1.g.V().has("group", "groupId", groupId);
    if ((filters === null || filters === void 0 ? void 0 : filters.onlyIfAMemberHasUserId) != null) {
        traversal = traversal.where(database_manager_1.__.in_("member").has("userId", filters.onlyIfAMemberHasUserId));
    }
    if ((filters === null || filters === void 0 ? void 0 : filters.onlyIfAMemberHasToken) != null) {
        traversal = traversal.where(database_manager_1.__.in_("member").has("token", filters.onlyIfAMemberHasToken));
    }
    return traversal;
}
exports.queryToGetGroupById = queryToGetGroupById;
function queryToGetAllGroupsOfUser(userToken) {
    return (0, queries_1.queryToGetUserByToken)(userToken, null, true).out("member");
}
exports.queryToGetAllGroupsOfUser = queryToGetAllGroupsOfUser;
// For admin usage only
function queryToGetAllGroups(includeDemoGroups = false) {
    let traversal = database_manager_1.g.V().hasLabel("group");
    if (!includeDemoGroups) {
        traversal = traversal.not(database_manager_1.__.has("demoGroup", true));
    }
    return traversal;
}
exports.queryToGetAllGroups = queryToGetAllGroups;
function queryToUpdateGroupProperty(newProps, filters) {
    let traversal = queryToGetGroupById(newProps.groupId, filters);
    for (const key of Object.keys(newProps)) {
        let value = newProps[key];
        value = (0, data_conversion_tools_1.serializeIfNeeded)(value);
        value = (0, data_conversion_tools_1.encodeIfNeeded)(value, key, "group"); // This should be after serializeIfNeeded() so it can act in the case of a json stringified covering all the sub-properties
        traversal = traversal.property(database_manager_1.cardinality.single, key, value);
    }
    return (0, database_manager_1.sendQuery)(() => traversal.iterate());
}
exports.queryToUpdateGroupProperty = queryToUpdateGroupProperty;
/**
 * Receives a traversal that selects a members edge unless specified in the options parameter. Then
 * changes the specified member edge properties of the specified user and finally returns a traversal
 * with the group.
 */
function queryToUpdateMembershipProperty(traversal, userToken, properties, options) {
    if ((options === null || options === void 0 ? void 0 : options.fromGroup) !== false) {
        traversal = traversal.inE("member").where(database_manager_1.__.outV().has("user", "token", userToken));
    }
    for (const key of Object.keys(properties)) {
        // cardinality.single is not used here because we are positioned in an edge
        traversal = traversal.property(key, (0, data_conversion_tools_1.serializeIfNeeded)(properties[key]));
    }
    traversal = traversal.inV();
    return traversal;
}
exports.queryToUpdateMembershipProperty = queryToUpdateMembershipProperty;
/**
 * Receives a traversal that selects a group and transfer the group value "chatMessagesAmount" to the
 * membership value "readMessagesAmount" to register the action of a user reading all current messages.
 * Returns the membership edge for more changes unless specified in the options parameter.
 */
function queryToUpdatedReadMessagesAmount(traversal, userToken, options) {
    traversal = traversal.inE("member").where(database_manager_1.__.outV().has("user", "token", userToken));
    traversal = traversal.property("readMessagesAmount", database_manager_1.__.inV().values("chatMessagesAmount"));
    if ((options === null || options === void 0 ? void 0 : options.returnGroup) !== false) {
        traversal = traversal.inV();
    }
    return traversal;
}
exports.queryToUpdatedReadMessagesAmount = queryToUpdatedReadMessagesAmount;
/**
 * Receives a group traversal and returns a gremlin map with the read messages of the user and total group messages.
 * Useful to implement a badge of unread messages.
 */
function queryToGetReadMessagesAndTotal(traversal, userToken) {
    return traversal
        .project("read", "total")
        .by(database_manager_1.__.inE("member").where(database_manager_1.__.outV().has("user", "token", userToken)).values("readMessagesAmount"))
        .by(database_manager_1.__.values("chatMessagesAmount"));
}
exports.queryToGetReadMessagesAndTotal = queryToGetReadMessagesAndTotal;
/**
 * Gets the list of users that are able to receive new chat message notification.
 * Also this function updates membership properties to avoid notification spam
 */
function queryToGetMembersForNewMsgNotification(groupId, authorUserId) {
    return (queryToGetGroupById(groupId)
        .inE("member")
        .not(database_manager_1.__.outV().has("userId", authorUserId)) // This prevents a notification to the author of the message
        .has("newMessagesRead", true)
        // We don't use cardinality.single here because we are working on an edge
        .property("newMessagesRead", false) // This prevents spam
        .outV());
}
exports.queryToGetMembersForNewMsgNotification = queryToGetMembersForNewMsgNotification;
function queryToGetGroupsToSendReminder(timeRemaining, reminderProp) {
    return database_manager_1.g
        .V()
        .hasLabel("group")
        .has("mostVotedDate", database_manager_1.P.inside(moment().unix(), moment().unix() + timeRemaining))
        .has(reminderProp, false)
        .property(database_manager_1.cardinality.single, reminderProp, true);
}
exports.queryToGetGroupsToSendReminder = queryToGetGroupsToSendReminder;
/**
 * Receives a traversal that selects one or more groups vertices and returns them in a value map format.
 * Also optionally includes the members list and date ideas.
 *
 * To experiment with this query:
 * https://gremlify.com/v333jvq76gr
 *
 * @param traversal A traversal that has one or more groups.
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 */
function queryToGetGroupsInFinalFormat(traversal, includeFullDetails = true) {
    let detailsTraversals = [];
    if (includeFullDetails) {
        detailsTraversals = [
            // Add the details about the members of the group
            database_manager_1.__.project("members").by(database_manager_1.__.in_("member").valueMap().by(database_manager_1.__.unfold()).fold()),
            // Add the details about the usersIds that received a vote to their date idea and who voted
            database_manager_1.__.project("dateIdeasVotes").by(database_manager_1.__.inE("dateIdeaVote")
                .group()
                .by("ideaOfUser")
                .by(database_manager_1.__.outV().values("userId").fold())
                .unfold()
                .project("ideaOfUser", "votersUserId")
                .by(database_manager_1.__.select(database_manager_1.column.keys))
                .by(database_manager_1.__.select(database_manager_1.column.values))
                .fold()),
            // Add the matches relationships
            database_manager_1.__.project("matches").by(database_manager_1.__.in_("member")
                .map(database_manager_1.__.project("userId", "matches")
                .by(database_manager_1.__.values("userId"))
                .by(database_manager_1.__.both("SeenMatch").where(database_manager_1.__.out("member").as("group")).values("userId").fold()))
                .fold()),
        ];
    }
    traversal = traversal.map(database_manager_1.__.as("group")
        .union(database_manager_1.__.valueMap().by(database_manager_1.__.unfold()), ...detailsTraversals)
        .unfold()
        .group()
        .by(database_manager_1.__.select(database_manager_1.column.keys))
        .by(database_manager_1.__.select(database_manager_1.column.values)));
    return traversal;
}
exports.queryToGetGroupsInFinalFormat = queryToGetGroupsInFinalFormat;
/**
 * Only used in tests.
 * If no group list is provided all groups on the database are removed.
 */
async function queryToRemoveGroups(groups) {
    if (groups == null) {
        return database_manager_1.g.V().hasLabel("group").drop().iterate();
    }
    const ids = groups.map(u => u.groupId);
    return await (0, database_manager_1.sendQuery)(() => database_manager_1.g
        .inject(ids)
        .unfold()
        .map(database_manager_1.__.as("targetGroupId")
        .V()
        .hasLabel("group")
        .has("groupId", database_manager_1.__.where(database_manager_1.P.eq("targetGroupId")))
        .drop())
        .iterate());
}
exports.queryToRemoveGroups = queryToRemoveGroups;
function queryToFindShouldBeInactiveGroups() {
    let traversal = queryToGetAllGroups().not(database_manager_1.__.has("isActive", false));
    traversal = traversal.has("creationDate", database_manager_1.P.lt(moment().unix() - configurations_1.GROUP_ACTIVE_TIME));
    return traversal;
}
exports.queryToFindShouldBeInactiveGroups = queryToFindShouldBeInactiveGroups;
//# sourceMappingURL=queries.js.map