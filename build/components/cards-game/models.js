"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAllUsersAboutNewCards = exports.recommendationsFromTagGet = exports.dislikedUsersGet = exports.recommendationsGet = exports.initializeCardsGame = void 0;
const dynamic_1 = require("set-interval-async/dynamic");
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
async function initializeCardsGame() {
    (0, dynamic_1.setIntervalAsync)(notifyAllUsersAboutNewCards, configurations_1.NEW_CARDS_NOTIFICATION_CHECK_FREQUENCY);
}
exports.initializeCardsGame = initializeCardsGame;
async function recommendationsGet(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
    const recommendationsQuery = (0, queries_2.queryToGetCardsRecommendations)(user);
    const result = await (0, data_conversion_2.fromQueryToCardsResult)(recommendationsQuery);
    return mergeResults(result);
}
exports.recommendationsGet = recommendationsGet;
async function dislikedUsersGet(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
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
 * TODO: This is too expensive, optimization: There is no point on notifying of new users that disliked you or
 * new users that did't see you yet. So the only remaining case where it's useful to notify is when you get a
 * like, so you can see the user and like it back, that's a lot less users to navigate and it's based on an
 * event instead of a repeating whole database search.
 *
 * This is the workflow:
 *    When there are no more cards on the cards game the client sets sendNewUsersNotification to a number.
 *    This number is the amount of new users that needs to appear on the application to notify the user.
 *
 * This function:
 *    1. Finds all users with sendNewUsersNotification > 0
 *    2. Searches recommendations for that user
 *    3. If the recommendations amount is equal or more than sendNewUsersNotification sends the notification.
 *    4. After sending the notification sets sendNewUsersNotification to -1, this value means that the functionality
 *       is disabled because the cycle is complete and not because the user disabled it.
 *    5. When the user swipe cards and there are no more the client sets  sendNewUsersNotification again to repeat the cycle
 */
async function notifyAllUsersAboutNewCards() {
    const porfiler = logTimeToFile("notifyUsersAboutNewCardsTask");
    const users = await (0, data_conversion_1.fromQueryToUserList)((0, queries_2.queryToGetAllUsersWantingNewCardsNotification)(), false);
    for (const user of users) {
        const recommendations = (await (0, queries_2.queryToGetCardsRecommendations)(user, { singleListResults: true, unordered: true }).toList()).length;
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
                text: (0, i18n_tools_1.t)("There are %s new users", { user }, String(recommendations)),
                idForReplacement: "newUsers",
            }, { sendPushNotification: true, channelId: user_1.NotificationChannelId.NewUsers });
        }
    }
    porfiler.done("Notifying users about new cards finished");
}
exports.notifyAllUsersAboutNewCards = notifyAllUsersAboutNewCards;
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