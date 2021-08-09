import { BaseContext } from "koa";
import { setIntervalAsync } from "set-interval-async/dynamic";
import {
   SEARCHER_LIKING_CHUNK,
   NON_SEARCHER_LIKING_CHUNK,
   NEW_CARDS_NOTIFICATION_CHECK_FREQUENCY,
   SHUFFLE_LIKING_NON_LIKING_RESULTS,
} from "../../configurations";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { BasicSingleTagParams } from "../../shared-tools/endpoints-interfaces/tags";
import { NotificationChannelId, NotificationType, User } from "../../shared-tools/endpoints-interfaces/user";
import { addNotificationToUser, retrieveFullyRegisteredUser } from "../user/models";
import { queryToUpdateUserProps } from "../user/queries";
import { fromQueryToUserList } from "../user/tools/data-conversion";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   queryToGetAllUsersWantingNewCardsNotification,
   queryToGetCardsRecommendations,
   queryToGetDislikedUsers,
} from "./queries";
import { queryToGetUsersSubscribedToTags } from "../tags/queries";
import { CardsGameResult, fromQueryToCardsResult } from "./tools/data-conversion";
import { divideArrayCallback, shuffleArray } from "../../common-tools/js-tools/js-tools";
import { t } from "../../common-tools/i18n-tools/i18n-tools";

export async function initializeCardsGame(): Promise<void> {
   setIntervalAsync(notifyAllUsersAboutNewCards, NEW_CARDS_NOTIFICATION_CHECK_FREQUENCY);
}

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery: Traversal = queryToGetCardsRecommendations(user);
   const result: CardsGameResult = await fromQueryToCardsResult(recommendationsQuery);
   return mergeResults(result);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
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
export async function notifyAllUsersAboutNewCards(): Promise<void> {
   const porfiler = logTimeToFile("notifyUsersAboutNewCardsTask");

   const users: User[] = await fromQueryToUserList(queryToGetAllUsersWantingNewCardsNotification(), false);
   for (const user of users) {
      const recommendations: number = (
         await queryToGetCardsRecommendations(user, { singleListResults: true, unordered: true }).toList()
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
               text: t("There are %s new users", { user }, String(recommendations)),
               idForReplacement: "newUsers",
            },
            { sendPushNotification: true, channelId: NotificationChannelId.NewUsers },
         );
      }
   }

   porfiler.done("Notifying users about new cards finished");
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
