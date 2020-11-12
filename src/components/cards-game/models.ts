import { BaseContext } from 'koa';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import {
   SEARCHER_LIKING_CHUNK,
   NON_SEARCHER_LIKING_CHUNK,
   NOTIFICATION_FREQUENCY_NEW_CARDS,
   SHUFFLE_LIKING_NON_LIKING_RESULTS,
} from '../../configurations';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import { BasicThemeParams } from '../../shared-tools/endpoints-interfaces/themes';
import { NotificationType, User } from '../../shared-tools/endpoints-interfaces/user';
import { addNotificationToUser, retrieveFullyRegisteredUser } from '../user/models';
import { queryToUpdateUserProps } from '../user/queries';
import { fromQueryToUserList } from '../user/tools/data-conversion';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import {
   queryToGetAllUsersWantingNewCardsNotification,
   queryToGetCardsRecommendations,
   queryToGetDislikedUsers,
} from './queries';
import { queryToGetUsersSubscribedToThemes } from '../themes/queries';
import { CardsGameResult, fromQueryToCardsResult } from './tools/data-conversion';
import { divideArrayCallback, shuffleArray } from '../../common-tools/js-tools/js-tools';
import { t } from '../../common-tools/i18n-tools/i18n-tools';

export function initializeCardsGame(): void {
   setIntervalAsync(notifyAllUsersAboutNewCards, NOTIFICATION_FREQUENCY_NEW_CARDS);
}

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery: Traversal = queryToGetCardsRecommendations(user);
   const result: CardsGameResult = await fromQueryToCardsResult(recommendationsQuery);
   return mergeResults(result);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery: Traversal = queryToGetDislikedUsers(params.token, user);
   const result: CardsGameResult = await fromQueryToCardsResult(recommendationsQuery);
   return mergeResults(result);
}

export async function recommendationsFromThemeGet(params: BasicThemeParams, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   let traversal: Traversal = queryToGetUsersSubscribedToThemes(params.themeIds);
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
 *    4. After sending the notification sets sendNewUsersNotification to 0 to disable this functionality.
 */
export async function notifyAllUsersAboutNewCards(): Promise<void> {
   const users: User[] = await fromQueryToUserList(queryToGetAllUsersWantingNewCardsNotification(), false);
   for (const user of users) {
      const recommendations: number = (
         await queryToGetCardsRecommendations(user, { singleListResults: true, unordered: true }).toList()
      ).length;

      if (recommendations >= user.sendNewUsersNotification) {
         await queryToUpdateUserProps(user.token, [
            {
               key: 'sendNewUsersNotification',
               value: 0,
            },
         ]);
         await addNotificationToUser(user.token, {
            type: NotificationType.CardsGame,
            title: t(`There is new people in the app!`, { user }),
            text: t('There are %s new users', { user }, String(recommendations)),
         });
      }
   }
}

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
