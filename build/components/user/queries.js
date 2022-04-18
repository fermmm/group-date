"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToUnblockUser = exports.queryToBlockUser = exports.queryToRemoveSeen = exports.queryToSetLikingGender = exports.queryToSetUserGender = exports.queryToIncludeFullInfoInUserQuery = exports.queryToGetAttractionsReceived = exports.queryToGetAttractionsSent = exports.queryToGetMatches = exports.queryToSetAttraction = exports.queryToSetUserProps = exports.queryToRemoveUsers = exports.queryToGetUsersFromIdList = exports.queryToGetAllDemoUsers = exports.queryToGetAllCompleteUsers = exports.queryToGetAllUsers = exports.queryToUpdateUserProps = exports.queryToUpdateUserToken = exports.isNotDemoAccount = exports.hasProfileCompleted = exports.queryToGetUsersListFromIds = exports.queryToGetUserById = exports.queryToGetUserByEmail = exports.queryToGetUserByToken = exports.queryToGetUserByTokenOrId = exports.queryToCreateUser = void 0;
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const user_2 = require("../../shared-tools/validators/user");
const moment = require("moment");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const ts_tools_1 = require("../../common-tools/ts-tools/ts-tools");
const configurations_1 = require("../../configurations");
function queryToCreateUser(props) {
    const { token, email, setProfileCompletedForTesting, customUserIdForTesting, isAdmin, currentTraversal } = props;
    return queryToGetUserByToken(token, currentTraversal)
        .fold()
        .coalesce(database_manager_1.__.unfold(), database_manager_1.__.addV("user")
        .property(database_manager_1.cardinality.single, "token", token)
        .property(database_manager_1.cardinality.single, "userId", customUserIdForTesting !== null && customUserIdForTesting !== void 0 ? customUserIdForTesting : (0, string_tools_1.generateId)())
        .property(database_manager_1.cardinality.single, "email", email)
        .property(database_manager_1.cardinality.single, "language", configurations_1.DEFAULT_LANGUAGE)
        .property(database_manager_1.cardinality.single, "profileCompleted", setProfileCompletedForTesting !== null && setProfileCompletedForTesting !== void 0 ? setProfileCompletedForTesting : false)
        .property(database_manager_1.cardinality.single, "isAdmin", isAdmin === true ? true : false)
        .property(database_manager_1.cardinality.single, "sendNewUsersNotification", -1)
        .property(database_manager_1.cardinality.single, "lastGroupJoinedDate", moment().unix())
        .property(database_manager_1.cardinality.single, "registrationDate", moment().unix())
        .property(database_manager_1.cardinality.single, "imagesAmount", 0)
        .property(database_manager_1.cardinality.single, "notifications", `[]`)
        .property(database_manager_1.cardinality.single, "unwantedUser", false))
        .unfold();
}
exports.queryToCreateUser = queryToCreateUser;
function queryToGetUserByTokenOrId(tokenOrId) {
    if ((0, ts_tools_1.checkTypeByMember)(tokenOrId, "token")) {
        return queryToGetUserByToken(tokenOrId.token);
    }
    else if ((0, ts_tools_1.checkTypeByMember)(tokenOrId, "userId")) {
        return queryToGetUserById(tokenOrId.userId);
    }
    else {
        return null;
    }
}
exports.queryToGetUserByTokenOrId = queryToGetUserByTokenOrId;
function queryToGetUserByToken(token, currentTraversal, onlyCompleteUsers) {
    if (currentTraversal == null) {
        currentTraversal = database_manager_1.g;
    }
    currentTraversal = currentTraversal.V().has("user", "token", String(token));
    if (onlyCompleteUsers) {
        currentTraversal = hasProfileCompleted(currentTraversal);
    }
    return currentTraversal;
}
exports.queryToGetUserByToken = queryToGetUserByToken;
function queryToGetUserByEmail(email, currentTraversal) {
    if (currentTraversal == null) {
        currentTraversal = database_manager_1.g;
    }
    return currentTraversal.V().has("user", "email", String(email));
}
exports.queryToGetUserByEmail = queryToGetUserByEmail;
function queryToGetUserById(userId, currentTraversal, onlyCompleteUsers) {
    if (currentTraversal == null) {
        currentTraversal = database_manager_1.g;
    }
    currentTraversal = currentTraversal.V().has("user", "userId", String(userId));
    if (onlyCompleteUsers) {
        currentTraversal = hasProfileCompleted(currentTraversal);
    }
    return currentTraversal;
}
exports.queryToGetUserById = queryToGetUserById;
function queryToGetUsersListFromIds(usersIds, currentTraversal) {
    if (currentTraversal == null) {
        currentTraversal = database_manager_1.g;
    }
    currentTraversal = currentTraversal.V().hasLabel("user");
    const search = usersIds.map(userId => database_manager_1.__.has("userId", userId));
    return currentTraversal.or(...search);
}
exports.queryToGetUsersListFromIds = queryToGetUsersListFromIds;
/**
 * Receives a user traversal and returns the user only if has the profile completed
 */
function hasProfileCompleted(currentTraversal) {
    return currentTraversal.has("user", "profileCompleted", true);
}
exports.hasProfileCompleted = hasProfileCompleted;
function isNotDemoAccount(currentTraversal) {
    return currentTraversal.not(database_manager_1.__.has("demoAccount", true));
}
exports.isNotDemoAccount = isNotDemoAccount;
/**
 * Receives a traversal with a user and updates the token.
 */
async function queryToUpdateUserToken(traversal, newToken) {
    await (0, database_manager_1.sendQuery)(() => traversal.property(database_manager_1.cardinality.single, "token", newToken).next());
}
exports.queryToUpdateUserToken = queryToUpdateUserToken;
async function queryToUpdateUserProps(tokenOrTraversal, props) {
    await (0, database_manager_1.sendQuery)(() => {
        let query = typeof tokenOrTraversal === "string" ? queryToGetUserByToken(tokenOrTraversal) : tokenOrTraversal;
        for (const prop of props) {
            query = query.property(database_manager_1.cardinality.single, prop.key, (0, data_conversion_tools_1.serializeIfNeeded)(prop.value));
        }
        return query.next();
    });
}
exports.queryToUpdateUserProps = queryToUpdateUserProps;
function queryToGetAllUsers(props) {
    const { includeDemoAccounts = false } = props !== null && props !== void 0 ? props : {};
    let traversal = database_manager_1.g.V().hasLabel("user");
    if (!includeDemoAccounts) {
        traversal = traversal.not(database_manager_1.__.has("demoAccount", true));
    }
    return traversal;
}
exports.queryToGetAllUsers = queryToGetAllUsers;
function queryToGetAllCompleteUsers(props) {
    return queryToGetAllUsers(props).has("profileCompleted", true);
}
exports.queryToGetAllCompleteUsers = queryToGetAllCompleteUsers;
function queryToGetAllDemoUsers() {
    return database_manager_1.g.V().has("user", "demoAccount", true);
}
exports.queryToGetAllDemoUsers = queryToGetAllDemoUsers;
function queryToGetUsersFromIdList(userIds) {
    return database_manager_1.g
        .inject(userIds)
        .unfold()
        .map(database_manager_1.__.as("targetUserId")
        .V()
        .hasLabel("user")
        .has("userId", database_manager_1.__.where(database_manager_1.P.eq("targetUserId"))));
}
exports.queryToGetUsersFromIdList = queryToGetUsersFromIdList;
/**
 * Only used in tests.
 * If no user list is provided all users on the database are removed.
 */
async function queryToRemoveUsers(users) {
    if (users == null) {
        await (0, database_manager_1.sendQuery)(() => queryToGetAllUsers().drop().iterate());
    }
    else {
        const ids = users.map(u => u.userId);
        await (0, database_manager_1.sendQuery)(() => database_manager_1.g
            .inject(ids)
            .unfold()
            .map(database_manager_1.__.as("targetUserId")
            .V()
            .hasLabel("user")
            .has("userId", database_manager_1.__.where(database_manager_1.P.eq("targetUserId")))
            .drop())
            .iterate());
    }
    // This helps a little to mitigate NegativeArraySizeException Gremlin Server bug
    await (0, js_tools_1.time)(500);
}
exports.queryToRemoveUsers = queryToRemoveUsers;
/**
 * Receives a query that returns a user and adds properties to it.
 * @param traversal A query with one user vertex
 */
function queryToSetUserProps(traversal, newUserProps) {
    var _a, _b, _c;
    // Only props on editableUserPropsList are added into the query
    user_2.editableUserPropsList.forEach(editableUserProp => {
        if (newUserProps[editableUserProp] == null) {
            return;
        }
        traversal = traversal.property(database_manager_1.cardinality.single, editableUserProp, (0, data_conversion_tools_1.serializeIfNeeded)(newUserProps[editableUserProp]));
    });
    if (newUserProps.images) {
        traversal = traversal.property(database_manager_1.cardinality.single, "imagesAmount", (_a = newUserProps.images.length) !== null && _a !== void 0 ? _a : 0);
    }
    if (((_b = newUserProps.genders) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        traversal = queryToSetUserGender(traversal, newUserProps.genders);
    }
    if (((_c = newUserProps.likesGenders) === null || _c === void 0 ? void 0 : _c.length) > 0) {
        traversal = queryToSetLikingGender(traversal, newUserProps.likesGenders);
    }
    return traversal;
}
exports.queryToSetUserProps = queryToSetUserProps;
function queryToSetAttraction(params) {
    const traversalInit = database_manager_1.g.withSideEffect("injectedData", params.attractions);
    return isNotDemoAccount(hasProfileCompleted(queryToGetUserByToken(params.token, traversalInit)))
        .as("user")
        .select("injectedData")
        .unfold()
        .map(
    // Prepare the as()
    database_manager_1.__.as("attractionData")
        .select("attractionType")
        .as("attractionType")
        .select("attractionData")
        .select("userId")
        .as("targetUserId")
        // Get the target user
        .V()
        .hasLabel("user")
        .has("userId", database_manager_1.__.where(database_manager_1.P.eq("targetUserId")))
        // This prevents self like
        .not(database_manager_1.__.has("token", params.token))
        // On seen matches is not possible to edit the attraction anymore
        .not(database_manager_1.__.both("SeenMatch").where(database_manager_1.P.eq("user")))
        .as("targetUser")
        // Removes all edges pointing to the target user that are labeled as any attraction type (like or dislike)
        .sideEffect(database_manager_1.__.inE(...user_1.allAttractionTypes)
        .where(database_manager_1.__.outV().as("user"))
        .drop())
        // Also remove the match edge because at this point we don't know if they are going to match
        .sideEffect(database_manager_1.__.bothE("Match").where(database_manager_1.__.bothV().as("user")).drop())
        // Now we can add the new edge
        .addE(database_manager_1.__.select("attractionType"))
        .property("timestamp", moment().unix())
        .from_("user")
        // If the users like each other add a Match edge
        .select("targetUser")
        .and(database_manager_1.__.out("Like").where(database_manager_1.P.eq("user")), database_manager_1.__.in_("Like").where(database_manager_1.P.eq("user")), database_manager_1.__.not(database_manager_1.__.both("Match").where(database_manager_1.P.eq("user"))))
        .addE("Match")
        .from_("user")
        .property("timestamp", moment().unix()));
}
exports.queryToSetAttraction = queryToSetAttraction;
function queryToGetMatches(token) {
    return queryToGetUserByToken(token).both(...user_1.allMatchTypes);
}
exports.queryToGetMatches = queryToGetMatches;
function queryToGetAttractionsSent(token, types) {
    types = types !== null && types !== void 0 ? types : user_1.allAttractionTypes;
    return queryToGetUserByToken(token)
        .as("user")
        .out(...types)
        .where(database_manager_1.__.not(database_manager_1.__.both(...user_1.allMatchTypes).as("user")));
}
exports.queryToGetAttractionsSent = queryToGetAttractionsSent;
function queryToGetAttractionsReceived(token, types) {
    types = types !== null && types !== void 0 ? types : user_1.allAttractionTypes;
    return queryToGetUserByToken(token)
        .as("user")
        .in_(...types)
        .where(database_manager_1.__.not(database_manager_1.__.both(...user_1.allMatchTypes).as("user")));
}
exports.queryToGetAttractionsReceived = queryToGetAttractionsReceived;
function queryToIncludeFullInfoInUserQuery(traversal) {
    return traversal.map(database_manager_1.__.union(
    // Include all user props
    database_manager_1.__.valueMap().by(database_manager_1.__.unfold()), 
    // Include tags subscribed
    database_manager_1.__.project("tagsSubscribed").by(database_manager_1.__.out("subscribed").valueMap("tagId", "name", "visible").by(database_manager_1.__.unfold()).fold()), 
    // Include tags blocked
    database_manager_1.__.project("tagsBlocked").by(database_manager_1.__.out("blocked").valueMap("tagId", "name", "visible").by(database_manager_1.__.unfold()).fold()))
        .unfold()
        .group()
        .by(database_manager_1.__.select(database_manager_1.column.keys))
        .by(database_manager_1.__.select(database_manager_1.column.values)));
}
exports.queryToIncludeFullInfoInUserQuery = queryToIncludeFullInfoInUserQuery;
/**
 * Receives a traversal that selects one or more users and sets the gender
 */
function queryToSetUserGender(traversal, genders) {
    return traversal
        .as("user")
        .sideEffect(database_manager_1.__.outE("isGender").drop())
        .sideEffect(database_manager_1.__.V()
        .union(...genders.map(gender => database_manager_1.__.has("gender", "genderId", gender)))
        .addE("isGender")
        .from_("user"));
}
exports.queryToSetUserGender = queryToSetUserGender;
/**
 * Receives a traversal that selects one or more users and sets the gender liked
 */
function queryToSetLikingGender(traversal, genders) {
    return traversal
        .as("user")
        .sideEffect(database_manager_1.__.outE("likesGender").drop())
        .sideEffect(database_manager_1.__.V()
        .union(...genders.map(gender => database_manager_1.__.has("gender", "genderId", gender)))
        .addE("likesGender")
        .from_("user"));
}
exports.queryToSetLikingGender = queryToSetLikingGender;
/**
 * This query is called when a user requests a SeenMatch to become a Match, so they can be in a
 * group together again. This is useful when the group didn't meet because not enough users wanted
 * to meet but those who wanted to meet can request for a second chance.
 * To make the change is required that both users request the change. So the first user requesting
 * is only saved and no change is made.
 *
 * https://gremlify.com/fnm8oj1ni5s
 */
function queryToRemoveSeen(props) {
    const { requesterUserId, targetUserId } = props;
    let traversal = queryToGetUserById(requesterUserId).as("user");
    traversal = queryToGetUserById(targetUserId, traversal).as("targetUser");
    // Get the seen match edge, we are going to add the request there or replace it.
    traversal = traversal
        .bothE("SeenMatch")
        .where(database_manager_1.__.bothV().as("user"))
        .choose(database_manager_1.__.has("requestedToRemoveSeen", targetUserId), 
    // If the target user already requested to remove the seen match we replace the SeenMatch by a Match
    database_manager_1.__.sideEffect(database_manager_1.__.drop()).select("user").addE("Match").to("targetUser"), 
    // If this is the first request between them we only store the request. cardinality.single is not used here because we are in an edge
    database_manager_1.__.property("requestedToRemoveSeen", requesterUserId));
    return traversal;
}
exports.queryToRemoveSeen = queryToRemoveSeen;
function queryToBlockUser(props) {
    const { requesterUserId, targetUserId } = props;
    let traversal = queryToGetUserById(targetUserId).as("targetUser");
    traversal = queryToGetUserById(requesterUserId, traversal);
    traversal = traversal.coalesce(database_manager_1.__.outE("blockedUser"), database_manager_1.__.addE("blockedUser").to("targetUser"));
    return traversal;
}
exports.queryToBlockUser = queryToBlockUser;
function queryToUnblockUser(props) {
    const { requesterUserId, targetUserId } = props;
    let traversal = queryToGetUserById(targetUserId).as("targetUser");
    traversal = queryToGetUserById(requesterUserId, traversal);
    traversal = traversal.outE("blockedUser").where(database_manager_1.__.inV().as("targetUser")).drop();
    return traversal;
}
exports.queryToUnblockUser = queryToUnblockUser;
//# sourceMappingURL=queries.js.map