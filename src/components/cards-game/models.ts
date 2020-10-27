import { BaseContext } from 'koa';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { NOTIFICATION_FREQUENCY_NEW_CARDS } from '../../configurations';
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

export function initializeCardsGame(): void {
   setIntervalAsync(notifyAllUsersAboutNewCards, NOTIFICATION_FREQUENCY_NEW_CARDS);
}

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = queryToGetCardsRecommendations(user);
   return fromQueryToUserList(recommendationsQuery);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = queryToGetDislikedUsers(params.token, user);
   return fromQueryToUserList(recommendationsQuery);
}

export async function recommendationsFromThemeGet(params: BasicThemeParams, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const fromTheme: Traversal = queryToGetUsersSubscribedToThemes(params.themeIds);
   const recommendationsQuery = queryToGetCardsRecommendations(user, fromTheme);
   return fromQueryToUserList(recommendationsQuery);
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
      const recommendations: number = (await queryToGetCardsRecommendations(user).toList()).length;
      if (recommendations >= user.sendNewUsersNotification) {
         await queryToUpdateUserProps(user.token, [
            {
               key: 'sendNewUsersNotification',
               value: 0,
            },
         ]);
         await addNotificationToUser(user.token, {
            type: NotificationType.CardsGame,
            title: `¡Hay mas gente!`,
            text: `Hay ${recommendations} usuarixs nuevxs para que veas.`,
         });
      }
   }
}
