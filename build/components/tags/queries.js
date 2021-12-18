"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToRemoveTags = exports.queryToGetUsersSubscribedToTags = exports.queryToRelateUserWithTag = exports.queryToGetTagsCreatedByUser = exports.queryToGetTags = exports.queryToCreateTags = void 0;
const moment = require("moment");
const common_queries_1 = require("../../common-tools/database-tools/common-queries");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const configurations_1 = require("../../configurations");
const queries_1 = require("../user/queries");
function queryToCreateTags(userId, tagsToCreate) {
    const traversal = common_queries_1.queryToCreateVerticesFromObjects({
        objects: tagsToCreate,
        label: "tag",
        duplicationAvoidanceProperty: "tagId",
    });
    if (userId == null) {
        return traversal;
    }
    return traversal
        .fold()
        .as("t")
        .union(queries_1.queryToGetUserById(userId, database_manager_1.__).as("user"))
        .select("t")
        .unfold()
        .sideEffect(database_manager_1.__.map(
    // Create an edge to keep track of who created the tag
    database_manager_1.__.sideEffect(database_manager_1.__.addE("createdTag").from_("user"))));
}
exports.queryToCreateTags = queryToCreateTags;
/**
 * Set countryFilter as "all" to return tags from all countries, useful for admins.
 */
function queryToGetTags(filters) {
    const filtersAsTraversal = [database_manager_1.__.has("global", true)];
    if ((filters === null || filters === void 0 ? void 0 : filters.countryFilter) != "all") {
        filtersAsTraversal.push(database_manager_1.__.has("country", filters.countryFilter));
    }
    else {
        filtersAsTraversal.push(database_manager_1.__.has("country")); // This includes all countries into the query
    }
    return database_manager_1.g
        .V()
        .hasLabel("tag")
        .or(...filtersAsTraversal);
}
exports.queryToGetTags = queryToGetTags;
/**
 * @param timeFilter This filter the results by time, for example: pass a week (in seconds) the get the tags created in the last week
 */
function queryToGetTagsCreatedByUser(token, timeFilter) {
    let traversal = queries_1.queryToGetUserByToken(token)
        .as("user")
        .out("createdTag")
        .where(database_manager_1.P.eq("user"))
        .by("country")
        .by("country");
    if (timeFilter != null) {
        traversal = traversal.where(database_manager_1.__.values("creationDate").is(database_manager_1.P.gte(moment().unix() - timeFilter)));
    }
    return traversal;
}
exports.queryToGetTagsCreatedByUser = queryToGetTagsCreatedByUser;
/**
 * To play with the query:
 * https://gremlify.com/xeqxrbq7uv8
 *
 * @param relation The relation to add or remove
 * @param remove true = adds the relation. false = removes the relation
 */
function queryToRelateUserWithTag(token, tagsIds, relation, remove) {
    let relationTraversal;
    if (remove) {
        relationTraversal = database_manager_1.__.inE(relation).where(database_manager_1.__.outV().has("token", token)).drop();
    }
    else {
        relationTraversal = database_manager_1.__.coalesce(database_manager_1.__.in_(relation).where(database_manager_1.P.eq("user")), database_manager_1.__.addE(relation).from_("user"));
        // For subscribing there is a maximum of tags a user can subscribe per country
        if (relation === "subscribed") {
            relationTraversal = database_manager_1.__.coalesce(database_manager_1.__.select("user")
                .out("subscribed")
                .where(database_manager_1.P.eq("tag"))
                .by("country")
                .by("country")
                .count()
                .is(database_manager_1.P.gte(configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED)), relationTraversal);
        }
    }
    return database_manager_1.g
        .inject(tagsIds)
        .as("tags")
        .union(queries_1.queryToGetUserByToken(token, database_manager_1.__).as("user"))
        .select("tags")
        .unfold()
        .map(database_manager_1.__.as("tagId")
        .V()
        .hasLabel("tag")
        .has("tagId", database_manager_1.__.where(database_manager_1.P.eq("tagId")))
        .as("tag")
        .sideEffect(relationTraversal)
        .property(database_manager_1.cardinality.single, "lastInteractionDate", moment().unix())
        .property(database_manager_1.cardinality.single, "subscribersAmount", database_manager_1.__.inE("subscribed").count())
        .property(database_manager_1.cardinality.single, "blockersAmount", database_manager_1.__.inE("blocked").count()));
}
exports.queryToRelateUserWithTag = queryToRelateUserWithTag;
function queryToGetUsersSubscribedToTags(tagsIds) {
    return database_manager_1.g
        .inject(tagsIds)
        .unfold()
        .flatMap(database_manager_1.__.as("tagId")
        .V()
        .hasLabel("tag")
        .has("tagId", database_manager_1.__.where(database_manager_1.P.eq("tagId")))
        .in_("subscribed"));
}
exports.queryToGetUsersSubscribedToTags = queryToGetUsersSubscribedToTags;
function queryToRemoveTags(tagsIds) {
    return database_manager_1.g
        .inject(tagsIds)
        .unfold()
        .map(database_manager_1.__.as("tagId")
        .V()
        .hasLabel("tag")
        .has("tagId", database_manager_1.__.where(database_manager_1.P.eq("tagId")))
        .drop());
}
exports.queryToRemoveTags = queryToRemoveTags;
//# sourceMappingURL=queries.js.map