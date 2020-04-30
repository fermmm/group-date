import { BaseContext } from 'koa';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { queryToUserList } from '../../common-tools/database-tools/data-convertion-tools';
import { SEND_NEW_CARDS_NOTIFICATION_FREQUENCY } from '../../configurations';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import { NotificationType, User } from '../../shared-tools/endpoints-interfaces/user';
import { retrieveFullyRegisteredUser } from '../common/models';
import { updateUserProps } from '../common/queries';
import { addNotificationToUser } from '../user/models';
import { getAllUsersWantingNewCardsNotification, getDislikedUsers, getRecommendations } from './queries';

export function scheduledTasksCardGame(): void {
   setIntervalAsync(notifyAllUsersAboutNewCards, SEND_NEW_CARDS_NOTIFICATION_FREQUENCY);
}

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = getRecommendations(user);
   return queryToUserList(recommendationsQuery);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = getDislikedUsers(params.token, user);
   return queryToUserList(recommendationsQuery);
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
   const users: User[] = await queryToUserList(getAllUsersWantingNewCardsNotification(), false);
   for (const user of users) {
      const recommendations: number = (await getRecommendations(user).toList()).length;
      if (recommendations >= user.sendNewUsersNotification) {
         await updateUserProps(user.token, [
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
