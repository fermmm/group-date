import { Expo, ExpoPushErrorReceipt, ExpoPushMessage, ExpoPushSuccessTicket } from "expo-server-sdk";

export const expo = new Expo();

export async function sendPushNotifications(messages: ExpoPushMessage[]) {
   let tickets: ExpoPushSuccessTicket[] = [];
   /**
    * The Expo push notification service accepts batches of notifications so
    * that you don't need to send 1000 requests to send 1000 notifications. We
    * recommend you batch your notifications to reduce the number of requests
    * and to compress them (notifications with similar content will get
    * compressed).
    */
   let notificationsChunks = expo.chunkPushNotifications(messages);
   for (let chunk of notificationsChunks) {
      try {
         let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
         tickets.push(...(ticketChunk as ExpoPushSuccessTicket[]));
         // NOTE: If a ticket contains an error code in ticket.details.error, you
         // must handle it appropriately. The error codes are listed in the Expo
         // documentation:
         // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
         console.warn(error);
      }
   }

   return tickets;
}

/**
 * After the Expo push notification service has delivered the
 * notifications to Apple or Google (usually quickly, but allow the the service
 * up to 30 minutes when under load), a "receipt" for each notification is
 * created. The receipts will be available for at least a day; stale receipts
 * are deleted.
 *
 * The ID of each receipt is sent back in the response "ticket" for each
 * notification. In summary, sending a notification produces a ticket, which
 * contains a receipt ID you later use to get the receipt.
 *
 * The receipts may contain error codes to which you must respond. In
 * particular, Apple or Google may block apps that continue to send
 * notifications to devices that have blocked notifications or have uninstalled
 * your app. Expo does not control this policy and sends back the feedback from
 * Apple and Google so you can handle it appropriately.
 *
 * What this function do is given a list of tickets checks in the expo server for
 * a delivery status and returns the error messages of the ones that were not delivered
 * */
export async function getNotificationsDeliveryErrors(tickets: ExpoPushSuccessTicket[]) {
   let receiptIds = [];
   let errorMessages = [];

   for (let ticket of tickets) {
      // NOTE: Not all tickets have IDs; for example, tickets for notifications
      // that could not be enqueued will have error information and no receipt ID.
      if (ticket.id) {
         receiptIds.push(ticket.id);
      }
   }

   let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
   for (let chunk of receiptIdChunks) {
      try {
         let receipts = await expo.getPushNotificationReceiptsAsync(chunk);

         // The receipts specify whether Apple or Google successfully received the
         // notification and information about an error, if one occurred.
         for (let receiptId in receipts) {
            let { status, message, details } = receipts[receiptId] as ExpoPushErrorReceipt;
            if ((status as string) === "ok") {
               continue;
            } else if (status === "error") {
               let errorMsg = `There was an error sending a notification: ${message}`;
               if (details && details.error) {
                  // The error codes are listed in the Expo documentation:
                  // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                  // You must handle the errors appropriately.
                  errorMsg += `. The error code is ${details.error}`;
               }
               errorMessages.push(errorMsg);
            }
         }
      } catch (error) {
         console.warn(`Error when trying to get notification delivery status from Expo: ${error}`);
      }
   }

   return errorMessages;
}

export function isValidNotificationsToken(token: string): boolean {
   return Expo.isExpoPushToken(token);
}
