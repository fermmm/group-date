"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUsersAboutNewCards = exports.recommendationsFromTagGet = exports.dislikedUsersGet = exports.recommendationsGet = exports.initializeCardsGame = void 0;
const configurations_1 = require("../../configurations");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const models_1 = require("../user/models");
const queries_1 = require("../user/queries");
const data_conversion_1 = require("../user/tools/data-conversion");
const queries_2 = require("./queries");
const queries_3 = require("../tags/queries");
const data_conversion_2 = require("./tools/data-conversion");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const measureTime_1 = require("../../common-tools/js-tools/measureTime");
const log_1 = require("../../common-tools/log-tool/log");
const types_1 = require("../../common-tools/log-tool/types");
async function initializeCardsGame() { }
exports.initializeCardsGame = initializeCardsGame;
async function recommendationsGet(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
    if (user.locationLat == null || user.locationLon == null) {
        ctx.throw(400, (0, i18n_tools_1.t)("We don't have your location", { ctx, user }));
        return;
    }
    if (user.demoAccount) {
        return await (0, data_conversion_1.fromQueryToUserList)((0, queries_2.queryToGetDemoCardsRecommendations)(user), true, false);
    }
    const recommendationsQuery = (0, queries_2.queryToGetCardsRecommendations)(user);
    const result = await (0, data_conversion_2.fromQueryToCardsResult)(recommendationsQuery);
    // Send a notification to the users about new cards when needed
    notifyUsersAboutNewCards({
        userIds: [...result.liking.map(u => u.userId), ...result.others.map(u => u.userId)],
    });
    /*
     * This ensures that the amount of users sent to the client is limited, the query may
     * return more users than the limit so it needs to be limited here before sending.
     * The query returning more users than the limit is useful for notifications but it
     * should not send all the results to the client.
     */
    (0, js_tools_1.limitArray)(result.liking, configurations_1.CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING);
    (0, js_tools_1.limitArray)(result.others, configurations_1.CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS);
    const finalResult = mergeResults(result);
    return finalResult;
}
exports.recommendationsGet = recommendationsGet;
async function dislikedUsersGet(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
    if (user.locationLat == null || user.locationLon == null) {
        ctx.throw(400, (0, i18n_tools_1.t)("We don't have your location", { ctx, user }));
        return;
    }
    const recommendationsQuery = (0, queries_2.queryToGetDislikedUsers)({
        token: params.token,
        searcherUser: user,
        invertOrder: false,
    });
    return await (0, data_conversion_1.fromQueryToUserList)(recommendationsQuery);
}
exports.dislikedUsersGet = dislikedUsersGet;
async function recommendationsFromTagGet(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
    let traversal = (0, queries_3.queryToGetUsersSubscribedToTags)([params.tagId]);
    traversal = (0, queries_2.queryToGetCardsRecommendations)(user, { traversal });
    const result = await (0, data_conversion_2.fromQueryToCardsResult)(traversal);
    return mergeResults(result);
}
exports.recommendationsFromTagGet = recommendationsFromTagGet;
/**
 * Sends a notification about new cards to the list of users provided, first it checks if there are new
 * cards, the users that has no new cards will not be notified. If no list of users is provided then all
 * the users of the app will be checked, it's recommended to use this function with the list of users because
 * checking for cards for all users of the app it's an operation that may take too much time.
 *
 * This is the workflow:
 *    When there are no more cards on the cards game the client sets sendNewUsersNotification to a number.
 *    This number is the amount of new users that needs to appear on the application to send the notification.
 *
 * Implementation steps:
 *    1. Finds all users with sendNewUsersNotification > 0
 *    2. Searches recommendations for that user
 *    3. If the recommendations amount is equal or more than sendNewUsersNotification sends the notification.
 *    4. After sending the notification sets sendNewUsersNotification to -1, this value means that the functionality
 *       is disabled because the cycle is complete and not because the user disabled it.
 *    5. When the user swipe cards and there are no more the client sets sendNewUsersNotification again to repeat the cycle
 */
async function notifyUsersAboutNewCards(params) {
    const { userIds } = params !== null && params !== void 0 ? params : {};
    (0, measureTime_1.measureTime)("new_cards_time");
    const users = await (0, data_conversion_1.fromQueryToUserList)((0, queries_2.queryToGetUsersWantingNewCardsNotification)(userIds), false);
    for (const user of users) {
        const recommendations = (await (0, queries_2.queryToGetCardsRecommendations)(user, {
            singleListResults: true,
            unordered: true,
            limit: user.sendNewUsersNotification,
        }).toList()).length;
        if (recommendations >= user.sendNewUsersNotification) {
            await (0, queries_1.queryToUpdateUserProps)(user.token, [
                {
                    key: "sendNewUsersNotification",
                    value: -1,
                },
            ]);
            await (0, models_1.addNotificationToUser)({ token: user.token }, {
                type: user_1.NotificationType.CardsGame,
                title: (0, i18n_tools_1.t)(`There is new people in the app!`, { user }),
                text: (0, i18n_tools_1.t)("There are %s or more new users", { user }, String(recommendations)),
                idForReplacement: "newUsers",
            }, { sendPushNotification: true, channelId: user_1.NotificationChannelId.NewUsers });
        }
    }
    const timeItTookMs = (0, measureTime_1.finishMeasureTime)("new_cards_time");
    if (timeItTookMs > 1000) {
        (0, log_1.log)({
            problem: "Notifying about new cards took more than 1000 ms",
            timeItTookMs,
            amountOfUsersNotified: users.length,
        }, types_1.LogId.NotifyUsersAboutNewCards);
    }
}
exports.notifyUsersAboutNewCards = notifyUsersAboutNewCards;
/**
 * Queries returns an object with the users list divided into different categories, this merges the user
 * list into a single list in an interleaving pattern of chunks from the categories into the single list.
 */
function mergeResults(cardsGameResult) {
    const result = [];
    (0, js_tools_1.divideArrayCallback)(cardsGameResult.liking, configurations_1.SEARCHER_LIKING_CHUNK, likingChunk => {
        const chunk = [];
        if (cardsGameResult.others.length > 0) {
            // splice cuts the array and returns the slice
            chunk.push(...cardsGameResult.others.splice(0, configurations_1.NON_SEARCHER_LIKING_CHUNK));
        }
        chunk.push(...likingChunk);
        if (configurations_1.SHUFFLE_LIKING_NON_LIKING_RESULTS) {
            (0, js_tools_1.shuffleArray)(chunk);
        }
        result.push(...chunk);
    });
    // If the "liking" array is smaller than the "others" array then at this point we still have elements to add
    result.push(...cardsGameResult.others);
    return result;
}
//# sourceMappingURL=models.js.map