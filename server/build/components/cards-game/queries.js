"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToGetDemoCardsRecommendations = exports.queryToGetUsersWantingNewCardsNotification = exports.queryToGetDislikedUsers = exports.queryToDivideLikingUsers = exports.queryToOrderResults = exports.queryToFilterUsersNotLikingSearcherGenders = exports.queryToFilterByLikedGender = exports.queryToGetCardsRecommendations = void 0;
const date_tools_1 = require("./../../common-tools/math-tools/date-tools");
const moment = require("moment");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const constants_1 = require("../../common-tools/math-tools/constants");
const configurations_1 = require("../../configurations");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const queries_1 = require("../user/queries");
function queryToGetCardsRecommendations(searcherUser, settings) {
    var _a, _b;
    /**
     * Users that are incomplete should also be included because they may have profileCompleted = false because
     * a new feature and they didn't login to update. Since we only show users with picture we use that filter to
     * exclude too incomplete users.
     */
    let traversal = (_a = settings === null || settings === void 0 ? void 0 : settings.traversal) !== null && _a !== void 0 ? _a : (0, queries_1.queryToGetAllUsers)();
    /**
     * Is inside the distance range the user wants
     */
    traversal = traversal.has("locationLat", database_manager_1.P.inside(searcherUser.locationLat - searcherUser.targetDistance * constants_1.KM_TO_GPS, searcherUser.locationLat + searcherUser.targetDistance * constants_1.KM_TO_GPS));
    traversal = traversal.has("locationLon", database_manager_1.P.inside(searcherUser.locationLon - searcherUser.targetDistance * constants_1.KM_TO_GPS, searcherUser.locationLon + searcherUser.targetDistance * constants_1.KM_TO_GPS));
    /**
     * Don't show inactive accounts. Inactive means many time without login and no new users notifications pending
     */
    traversal = traversal.not(database_manager_1.__.has("lastLoginDate", database_manager_1.P.lt(moment().unix() - configurations_1.MAXIMUM_INACTIVITY_FOR_CARDS))
        .and()
        .has("sendNewUsersNotification", database_manager_1.P.lt(1)));
    /**
     * Has the genders wanted by the user
     */
    traversal = queryToFilterByLikedGender(traversal, searcherUser.likesGenders);
    /**
     * The users wants the searcher genders
     */
    traversal = queryToFilterUsersNotLikingSearcherGenders(traversal, searcherUser.genders);
    /**
     * Was not already reviewed by the user
     */
    if (!(settings === null || settings === void 0 ? void 0 : settings.showAlreadyReviewed)) {
        traversal = traversal.not(database_manager_1.__.inE(...user_1.allAttractionTypes).where(database_manager_1.__.outV().has("token", searcherUser.token)));
    }
    /**
     * It's not a Match or SeenMatch
     */
    traversal = traversal.not(database_manager_1.__.bothE(...user_1.allMatchTypes).where(database_manager_1.__.bothV().simplePath().has("token", searcherUser.token)));
    /**
     * Here we get the searcher user so he/she will be available in the future traversal steps as "searcherUser"
     * Also we store any data from the user that we need to have later.
     */
    traversal = traversal
        .fold()
        .as("results")
        // Get the searcher user and save it as "searcherUser"
        .union((0, queries_1.queryToGetUserById)(searcherUser.userId, database_manager_1.__).as("searcherUser"))
        // Save all elements required later
        .sideEffect(database_manager_1.__.out("blocked").store("blockedTags"))
        .sideEffect(database_manager_1.__.out("subscribed").store("subscribedTags"))
        // Go back to the results
        .select("results")
        .unfold();
    /**
     * Is not a subscriber of any searcher blocked tags:
     */
    traversal = traversal.not(database_manager_1.__.where(database_manager_1.__.out("subscribed").where(database_manager_1.P.within("blockedTags"))));
    /**
     * Does not have blocked a subscription of the user:
     */
    traversal = traversal.not(database_manager_1.__.where(database_manager_1.__.out("blocked").where(database_manager_1.P.within("subscribedTags"))));
    /**
     * Is not blocked by the searcher user
     */
    traversal = traversal.not(database_manager_1.__.inE("blockedUser").outV().as("searcherUser"));
    /**
     * It's another user (not self)
     */
    traversal = traversal.not(database_manager_1.__.has("userId", searcherUser.userId));
    /**
     * User likes the age
     */
    traversal = traversal.not(database_manager_1.__.has("birthDate", database_manager_1.P.outside((0, date_tools_1.fromAgeToBirthDate)(searcherUser.targetAgeMax), (0, date_tools_1.fromAgeToBirthDate)(searcherUser.targetAgeMin))));
    /**
     * Likes the age of the user
     */
    const searcherUserAge = (0, date_tools_1.fromBirthDateToAge)(searcherUser.birthDate);
    traversal = traversal.not(database_manager_1.__.has("targetAgeMin", database_manager_1.P.gt(searcherUserAge)));
    traversal = traversal.not(database_manager_1.__.has("targetAgeMax", database_manager_1.P.lt(searcherUserAge)));
    /**
     * The user is inside the distance the result wants
     * For testing of this weird syntax: https://gremlify.com/sva6t6120s
     * This is here to make sure this is done after filtering most users
     */
    traversal = traversal
        .as("a")
        .where(database_manager_1.P.gte("a"))
        .by("targetDistance")
        .by(database_manager_1.__.math(`abs(_ - ${searcherUser.locationLat}) * ${constants_1.GPS_TO_KM}`).by("locationLat"));
    traversal = traversal
        .as("a")
        .where(database_manager_1.P.gte("a"))
        .by("targetDistance")
        .by(database_manager_1.__.math(`abs(_ - ${searcherUser.locationLon}) * ${constants_1.GPS_TO_KM}`).by("locationLon"));
    /**
     * User is not banned
     */
    traversal = traversal.not(database_manager_1.__.has("banReasonsAmount", database_manager_1.P.gt(0)));
    /**
     * User has images
     */
    traversal = traversal.has("imagesAmount", database_manager_1.P.gt(0));
    /**
     * Order the results
     */
    if (!(settings === null || settings === void 0 ? void 0 : settings.unordered)) {
        traversal = queryToOrderResults(traversal, searcherUser);
    }
    /**
     * Create an output with 2 users list, the ones that likes the user and the others
     */
    if (!(settings === null || settings === void 0 ? void 0 : settings.singleListResults)) {
        traversal = queryToDivideLikingUsers(traversal, searcherUser, settings === null || settings === void 0 ? void 0 : settings.limit);
    }
    else {
        traversal = traversal.limit((_b = settings === null || settings === void 0 ? void 0 : settings.limit) !== null && _b !== void 0 ? _b : configurations_1.CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS);
    }
    return traversal;
}
exports.queryToGetCardsRecommendations = queryToGetCardsRecommendations;
/**
 * Not all the genders are covered by the same logic here because some genders contain information about the
 * user's genitals, others describe a feeling.
 * The users who don't care about genitals usually configures the app selecting all genders and that's all.
 * But there are users interested in filtering by genitals like hetero users, to enable this all users must
 * select at least one cis gender in the gender selection screen. This is a way of specifying the genitals
 * without asking directly.
 * Users can filter cis and trans genders because contains information about genitals. The rest of the genders
 * are not related to any filtering logic because it's not useful and to keep code simple and efficient.
 *
 * With this concept in mind, this is how it works:
 *
 *    There are 3 logic types applied to the genders without asking the user:
 *       "I need this gender", "Filter this gender" and "I don't care"
 *
 *    "I need this gender" = For selected cis genders: Users must have at least one of the cis genders that the searcher wants. Because hetero couples usually selects both cis genders and that should not be a problem.
 *    "Filter this gender" = For not selected trans genders: Transgender users with a trans gender that the searcher don't like are filtered out.
 *    "I don't care" = For the rest of the genders: Can't be filtered, no programming required.
 *
 * For testing:
 * https://gremlify.com/jkmf8yt8zzg
 */
function queryToFilterByLikedGender(traversal, likedGenders) {
    const selectedCisGenders = likedGenders.filter(gender => user_1.CIS_GENDERS.includes(gender));
    const notSelectedTransGenders = [...user_1.TRANS_GENDERS].filter(gender => !likedGenders.includes(gender));
    // Pick the users that has al least one of the cis genders selected
    if (selectedCisGenders.length > 0) {
        traversal = traversal.where(database_manager_1.__.or(...selectedCisGenders.map(gender => database_manager_1.__.out("isGender").has("genderId", gender))));
    }
    // Remove users that has a trans gender that is not selected
    if (notSelectedTransGenders.length > 0) {
        traversal = traversal.not(database_manager_1.__.where(database_manager_1.__.or(...notSelectedTransGenders.map(gender => database_manager_1.__.out("isGender").has("genderId", gender)))));
    }
    return traversal;
}
exports.queryToFilterByLikedGender = queryToFilterByLikedGender;
/**
 * To understand why this works like it does read the comment of queryToFilterByLikedGender() function.
 *
 * For testing:
 * https://gremlify.com/qzmyc00lsqh
 */
function queryToFilterUsersNotLikingSearcherGenders(traversal, searcherGenders) {
    const searcherCisGenders = searcherGenders.filter(gender => user_1.CIS_GENDERS.includes(gender));
    const searcherTransGenders = searcherGenders.filter(gender => user_1.TRANS_GENDERS.includes(gender));
    // User likes one of the searcher cis genders
    if (searcherCisGenders.length > 0) {
        traversal = traversal.where(database_manager_1.__.or(...searcherCisGenders.map(gender => database_manager_1.__.out("likesGender").has("genderId", gender))));
    }
    // User likes all searcher trans genders (if any)
    if (searcherTransGenders.length > 0) {
        traversal = traversal.where(database_manager_1.__.and(...searcherTransGenders.map(gender => database_manager_1.__.out("likesGender").has("genderId", gender))));
    }
    return traversal;
}
exports.queryToFilterUsersNotLikingSearcherGenders = queryToFilterUsersNotLikingSearcherGenders;
function queryToOrderResults(traversal, searcherUser) {
    return (traversal
        /**
         * This shuffle avoids 2 similar users getting the same result giving more visibility
         * to the first users in that case just because they are lucky.
         * Shuffle needs it's own order() and needs to be at the beginning.
         */
        .order()
        .by(database_manager_1.order.shuffle)
        .order()
        // Sub-order by subscribed matching tags
        .by(database_manager_1.__.out("subscribed").where(database_manager_1.P.within("subscribedTags")).count(), database_manager_1.order.desc)
        // Sub-order by subscribed blocked tags
        .by(database_manager_1.__.out("blocked").where(database_manager_1.P.within("blockedTags")).count(), database_manager_1.order.desc));
}
exports.queryToOrderResults = queryToOrderResults;
function queryToDivideLikingUsers(traversal, searcherUser, limit) {
    return traversal
        .group()
        .by(database_manager_1.__.choose(database_manager_1.__.out(user_1.AttractionType.Like).has("userId", searcherUser.userId), database_manager_1.__.constant("liking"), database_manager_1.__.constant("others")))
        .project("liking", "others")
        .by((0, queries_1.queryToIncludeFullInfoInUserQuery)(database_manager_1.__.select("liking").unfold())
        .limit(limit !== null && limit !== void 0 ? limit : configurations_1.CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING)
        .fold())
        .by((0, queries_1.queryToIncludeFullInfoInUserQuery)(database_manager_1.__.select("others").unfold())
        .limit(limit !== null && limit !== void 0 ? limit : configurations_1.CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS)
        .fold());
}
exports.queryToDivideLikingUsers = queryToDivideLikingUsers;
function queryToGetDislikedUsers(props) {
    const { token, searcherUser, invertOrder } = props;
    let traversal = (0, queries_1.queryToGetUserByToken)(token)
        .outE(user_1.AttractionType.Dislike)
        .order()
        .by("timestamp", invertOrder === true ? database_manager_1.order.desc : database_manager_1.order.asc)
        .inV();
    traversal = queryToGetCardsRecommendations(searcherUser, {
        traversal,
        showAlreadyReviewed: true,
        unordered: true,
        singleListResults: true,
    });
    return traversal;
}
exports.queryToGetDislikedUsers = queryToGetDislikedUsers;
function queryToGetUsersWantingNewCardsNotification(userIds) {
    let traversal;
    traversal = (0, queries_1.queryToGetUsersFromIdList)(userIds);
    traversal = traversal.has("sendNewUsersNotification", database_manager_1.P.gt(0));
    return traversal;
}
exports.queryToGetUsersWantingNewCardsNotification = queryToGetUsersWantingNewCardsNotification;
/**
 * This function could return the demo accounts and that is all but this is useful to test filters.
 */
function queryToGetDemoCardsRecommendations(searcherUser) {
    let traversal = (0, queries_1.queryToGetAllDemoUsers)();
    /**
     * User is not banned
     */
    traversal = traversal.not(database_manager_1.__.has("banReasonsAmount", database_manager_1.P.gt(0)));
    /**
     * It's another user (not self)
     */
    traversal = traversal.not(database_manager_1.__.has("userId", searcherUser.userId));
    /**
     * User has images
     */
    traversal = traversal.has("imagesAmount", database_manager_1.P.gt(0));
    return traversal;
}
exports.queryToGetDemoCardsRecommendations = queryToGetDemoCardsRecommendations;
//# sourceMappingURL=queries.js.map