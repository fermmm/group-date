import { BaseContext } from "koa";
import {
   SEARCHER_LIKING_CHUNK,
   NON_SEARCHER_LIKING_CHUNK,
   SHUFFLE_LIKING_NON_LIKING_RESULTS,
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING,
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS,
} from "../../configurations";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { BasicSingleTagParams } from "../../shared-tools/endpoints-interfaces/tags";
import { NotificationChannelId, NotificationType, User } from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveFullyRegisteredUser } from "../user/models";
import { queryToUpdateUserProps } from "../user/queries";
import { fromQueryToUserList } from "../user/tools/data-conversion";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   queryToGetUsersWantingNewCardsNotification,
   queryToGetCardsRecommendations,
   queryToGetDemoCardsRecommendations,
   queryToGetDislikedUsers,
} from "./queries";
import { queryToGetUsersSubscribedToTags } from "../tags/queries";
import { CardsGameResult, fromQueryToCardsResult } from "./tools/data-conversion";
import { divideArrayCallback, limitArray, shuffleArray } from "../../common-tools/js-tools/js-tools";
import { t } from "../../common-tools/i18n-tools/i18n-tools";
import { finishMeasureTime, measureTime } from "../../common-tools/js-tools/measureTime";
import { log } from "../../common-tools/log-tool/log";
import { LogId } from "../../common-tools/log-tool/types";

export async function initializeCardsGame(): Promise<void> {}

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);

   if (user.locationLat == null || user.locationLon == null) {
      ctx.throw(400, t("We don't have your location", { ctx, user }));
      return;
   }

   if (user.demoAccount) {
      return await fromQueryToUserList(queryToGetDemoCardsRecommendations(user), true, false);
   }

   const recommendationsQuery: Traversal = queryToGetCardsRecommendations(user);
   const result: CardsGameResult = await fromQueryToCardsResult(recommendationsQuery);

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
   limitArray(result.liking, CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING);
   limitArray(result.others, CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS);

   const finalResult = mergeResults(result);

   return finalResult;
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);

   if (user.locationLat == null || user.locationLon == null) {
      ctx.throw(400, t("We don't have your location", { ctx, user }));
      return;
   }

   const recommendationsQuery: Traversal = queryToGetDislikedUsers({
      token: params.token,
      searcherUser: user,
      invertOrder: false,
   });
   return await fromQueryToUserList(recommendationsQuery);
}

export async function recommendationsFromTagGet(
   params: BasicSingleTagParams,
   ctx: BaseContext,
): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   let traversal: Traversal = queryToGetUsersSubscribedToTags([params.tagId]);
   traversal = queryToGetCardsRecommendations(user, { traversal });
   const result: CardsGameResult = await fromQueryToCardsResult(traversal);
   return mergeResults(result);
}

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
export async function notifyUsersAboutNewCards(params: { userIds: string[] }): Promise<void> {
   const { userIds } = params ?? {};

   measureTime("new_cards_time");

   const users: User[] = await fromQueryToUserList(queryToGetUsersWantingNewCardsNotification(userIds), false);

   for (const user of users) {
      const recommendations: number = (
         await queryToGetCardsRecommendations(user, {
            singleListResults: true,
            unordered: true,
            limit: user.sendNewUsersNotification,
         }).toList()
      ).length;

      if (recommendations >= user.sendNewUsersNotification) {
         await queryToUpdateUserProps(user.token, [
            {
               key: "sendNewUsersNotification",
               value: -1,
            },
         ]);
         await addNotificationToUser(
            { token: user.token },
            {
               type: NotificationType.CardsGame,
               title: t(`There is new people in the app!`, { user }),
               text: t("There are %s or more new users", { user }, String(recommendations)),
               idForReplacement: "newUsers",
            },
            { sendPushNotification: true, channelId: NotificationChannelId.NewUsers },
         );
      }
   }

   const timeItTookMs = finishMeasureTime("new_cards_time");

   if (timeItTookMs > 1000) {
      log(
         {
            problem: "Notifying about new cards took more than 1000 ms",
            timeItTookMs,
            amountOfUsersNotified: users.length,
         },
         LogId.NotifyUsersAboutNewCards,
      );
   }
}

/**
 * Queries returns an object with the users list divided into different categories, this merges the user
 * list into a single list in an interleaving pattern of chunks from the categories into the single list.
 */
function mergeResults(cardsGameResult: CardsGameResult): User[] {
   const result: User[] = [];

   divideArrayCallback(cardsGameResult.liking, SEARCHER_LIKING_CHUNK, likingChunk => {
      const chunk: User[] = [];

      if (cardsGameResult.others.length > 0) {
         // splice cuts the array and returns the slice
         chunk.push(...cardsGameResult.others.splice(0, NON_SEARCHER_LIKING_CHUNK));
      }

      chunk.push(...likingChunk);
      if (SHUFFLE_LIKING_NON_LIKING_RESULTS) {
         shuffleArray(chunk);
      }
      result.push(...chunk);
   });

   // If the "liking" array is smaller than the "others" array then at this point we still have elements to add
   result.push(...cardsGameResult.others);

   return result;
}
