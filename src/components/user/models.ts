import {
   NotificationData,
   NotificationContent,
   ReportUserPostParams,
   ALL_GENDERS,
   DeleteAccountResponse,
   DeleteAccountPostParams,
   SetSeenPostParams,
   SetSeenResponse,
   TaskCompletedPostParams,
   TaskCompletedResponse,
   RequiredTask,
   SetSeenAction,
   BlockOrUnblockUserParams,
} from "./../../shared-tools/endpoints-interfaces/user";
import {
   isValidNotificationsToken,
   getNotificationsDeliveryErrors,
} from "./../../common-tools/push-notifications/push-notifications";
import { removePrivacySensitiveUserProps } from "./../../common-tools/security-tools/security-tools";
import { File } from "formidable";
import * as fs from "fs";
import * as Koa from "koa";
import { BaseContext, ParameterizedContext } from "koa";
import * as moment from "moment";
import * as path from "path";
import * as sharp from "sharp";
import { createFolder } from "../../common-tools/files-tools/files-tools";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import {
   AttractionType,
   FileUploadResponse,
   Notification,
   NotificationChannelId,
   NotificationType,
   ProfileStatusServerResponse,
   SetAttractionParams,
   User,
   UserGetParams,
   UserPostParams,
   UserPropAsQuestion,
} from "../../shared-tools/endpoints-interfaces/user";
import {
   requiredUserPropsList,
   RequiredUserPropKey,
   validateUserProps,
} from "../../shared-tools/validators/user";
import {
   queryToCreateUser,
   queryToGetAttractionsReceived,
   queryToGetAttractionsSent,
   queryToGetMatches,
   queryToGetUserByEmail,
   queryToGetUserById,
   queryToGetUserByToken,
   queryToRemoveSeen,
   queryToSetAttraction,
   queryToSetUserProps,
   queryToUpdateUserProps,
   queryToUpdateUserToken,
} from "./queries";
import { fromQueryToUser, fromQueryToUserList } from "./tools/data-conversion";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { cardinality, sendQuery } from "../../common-tools/database-tools/database-manager";
import { divideArrayCallback } from "../../common-tools/js-tools/js-tools";
import { getLocaleFromHeader, t } from "../../common-tools/i18n-tools/i18n-tools";
import { queryToGetUserByTokenOrId } from "./queries";
import { TokenIdOrUser, TokenOrId } from "./tools/typings";
import { getNotShowedQuestionIds } from "../tags/models";
import {
   APPLICATION_NAME,
   APP_AUTHORED_TAGS_AS_QUESTIONS,
   BIG_IMAGE_SIZE,
   ENABLE_PUSH_AND_EMAIL_NOTIFICATIONS_ON_DEBUG_MODE,
   LOG_PUSH_NOTIFICATION_DELIVERING_RESULT,
   MAX_FILE_SIZE_UPLOAD_ALLOWED,
   SMALL_IMAGE_SIZE,
   UNWANTED_USERS_PROPS,
   USER_PROPS_AS_QUESTIONS,
} from "../../configurations";
import { fromQueryToSpecificPropValue } from "../../common-tools/database-tools/data-conversion-tools";
import { sendPushNotifications } from "../../common-tools/push-notifications/push-notifications";
import { getUserEmailFromToken } from "./tools/authentication/getUserEmailFromAuthProvider";
import { queryToCreateVerticesFromObjects } from "../../common-tools/database-tools/common-queries";
import { fileSaverForImages } from "../../common-tools/koa-tools/koa-tools";
import { hoursToMilliseconds } from "../../common-tools/math-tools/general";
import { uploadFileToS3 } from "../../common-tools/aws/s3-tools";
import { isProductionMode, isRunningOnAws } from "../../common-tools/process/process-tools";
import { sendEmail } from "../../common-tools/email-tools/email-tools";
import { loadHtmlEmailTemplate } from "../../common-tools/email-tools/loadHtmlTemplate";
import { Tag } from "../../shared-tools/endpoints-interfaces/tags";

export async function initializeUsers(): Promise<void> {
   createFolder("uploads");
   createGenders();
}

/**
 * Tries to get the user using the Facebook token and if the user does not exist it creates it.
 * It does the following in order:
 *
 * 1. If the database finds the user with the provided token returns the user and that's all
 * 2. If the token does not exist in database then sends the token to Facebook to try to get the user email
 * 3. If Facebook does not return the email of the user it means the token is invalid: throws error (ctx.throw)
 * 4. If using the email the database finds a user then replaces token cached and returns the user
 * 5. If not, it means we are dealing with a new user, so it creates it with the email and token and returns it
 *
 * @param token Token from the Facebook login in the client application
 * @param includeFullInfo Includes tags data
 */
export async function retrieveUser(
   token: string,
   includeFullInfo: boolean,
   ctx: BaseContext,
): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await fromQueryToUser(queryToGetUserByToken(token), includeFullInfo);

   if (user != null) {
      return user;
   }

   // This function throws ctx error if the email cannot be retrieved
   const email = await getUserEmailFromToken(token, ctx);
   user = await fromQueryToUser(queryToGetUserByEmail(email), includeFullInfo);

   if (user != null) {
      await queryToUpdateUserToken(queryToGetUserByEmail(email), token);
      return { ...user, token };
   }

   return createUser({ token, email, includeFullInfo, ctx });
}

export async function createUser(props: {
   token: string;
   email: string;
   includeFullInfo: boolean;
   ctx: BaseContext;
   setProfileCompletedForTesting?: boolean;
   customUserIdForTesting?: string;
}): Promise<Partial<User>> {
   return fromQueryToUser(queryToCreateUser(props), props.includeFullInfo);
}

/**
 * This endpoint returns all user props that are missing, only when this endpoint returns empty arrays
 * the user can proceed with the endpoints not related with registration.
 * If the user does not exist this endpoint creates it and it should be used also for the user creation.
 * Also the language is set on this endpoint, example: "Accept-Language: es" on the header of the request.
 */
export async function profileStatusGet(
   params: TokenParameter,
   ctx: BaseContext,
): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retrieveUser(params.token, true, ctx);

   const result: ProfileStatusServerResponse = {
      missingEditableUserProps: getMissingEditableUserProps(user),
      notShowedTagQuestions: getNotShowedQuestionIds(user),
      user,
   };

   const profileCompleted: boolean =
      result.missingEditableUserProps.length === 0 && result.notShowedTagQuestions.length === 0;

   const lastLoginDate = moment().unix();
   const language = getLocaleFromHeader(ctx);

   await queryToUpdateUserProps(user.token, [
      {
         key: "profileCompleted",
         value: profileCompleted,
      },
      {
         key: "lastLoginDate",
         value: lastLoginDate,
      },
      {
         key: "language",
         value: language,
      },
   ]);

   /**
    * When this if executes it means the user just finished with all registration steps
    * Also this can happen inside the userPost function
    */
   if (!user.profileCompleted && profileCompleted) {
      sendWelcomeNotification(user, ctx);
   }

   // The returned user object should be up to date:
   result.user.profileCompleted = profileCompleted;
   result.user.lastLoginDate = lastLoginDate;
   result.user.language = language;

   return result;
}

function profileStatusIsCompleted(user: Partial<User>): boolean {
   return getMissingEditableUserProps(user).length === 0 && getNotShowedQuestionIds(user).length === 0;
}

function getMissingEditableUserProps(user: Partial<User>): RequiredUserPropKey[] {
   const result: RequiredUserPropKey[] = [];

   requiredUserPropsList.forEach(editableUserProp => {
      const propValue = user[editableUserProp];

      if (propValue == null) {
         result.push(editableUserProp);
      }
   });

   return result;
}

export function userPropsAsQuestionsGet(params: null, ctx: BaseContext): UserPropAsQuestion[] {
   // This just returns USER_PROPS_AS_QUESTIONS in the correct language:
   return USER_PROPS_AS_QUESTIONS.map(question => ({
      ...question,
      text: t(question.text, { ctx }),
      shortVersion: t(question.shortVersion, { ctx }),
      answers: question.answers.map(answer => ({
         ...answer,
         text: t(answer.text, { ctx }),
      })),
   }));
}

/**
 * This endpoint retrieves a user. If userId is not provided it will return the user using the token.
 * If userId is provided it will return the required user (without personal information) but also it will
 * check the token for security reasons.
 */
export async function userGet(params: UserGetParams, ctx: BaseContext): Promise<Partial<User>> {
   const userFromToken = await retrieveUser(params.token, true, ctx);
   if (params.userId == null) {
      return userFromToken;
   } else {
      if (userFromToken != null) {
         return removePrivacySensitiveUserProps(await fromQueryToUser(queryToGetUserById(params.userId), true));
      }
   }
}

/**
 * This endpoint is used to send the user props.
 */
export async function userPost(params: UserPostParams, ctx: BaseContext): Promise<void> {
   let query: Traversal = queryToGetUserByToken(params.token);

   if (params.props != null) {
      // Make sure user props content is valid
      const validationResult = validateUserProps(params.props);
      if (validationResult !== true) {
         ctx.throw(400, JSON.stringify(validationResult));
         return;
      }

      // Check if its unwanted user by checking the unwanted props
      if (isUnwantedUser({ propsToCheck: params.props })) {
         params.props.unwantedUser = true;
      }

      // Don't save the unicorn hunter as false since we want to know if the user was a unicorn hunter at any time
      if (params.props.isUnicornHunter === false) {
         delete params.props.isUnicornHunter;
      }

      // Don't save the unicorn hunter insisting as false since we want to know if the user was a unicorn hunter insisting at any time
      if (params.props.isUnicornHunterInsisting === false) {
         delete params.props.isUnicornHunterInsisting;
      }

      query = queryToSetUserProps(query, params.props);
   }

   await sendQuery(() => query.iterate());

   if (params.updateProfileCompletedProp) {
      const user = await retrieveUser(params.token, false, ctx);
      const profileCompleted = profileStatusIsCompleted(user);

      await sendQuery(() =>
         queryToGetUserByToken(params.token)
            .property(cardinality.single, "profileCompleted", profileCompleted)
            .iterate(),
      );

      /**
       * When this if executes it means the user just finished with all registration steps
       * Also this can happen inside the profileStatusGet function
       */
      if (!user.profileCompleted && profileCompleted) {
         sendWelcomeNotification(user, ctx);
      }
   }
}

/**
 * Calls retrieveUser and returns the same thing, but if profileCompleted is not true throws error
 *
 * @param token Token from the Facebook login in the client application
 * @param ctx
 */
export async function retrieveFullyRegisteredUser(
   token: string,
   includeFullInfo: boolean,
   ctx: BaseContext,
): Promise<User> {
   const user = await retrieveUser(token, includeFullInfo, ctx);

   if (!user.profileCompleted) {
      ctx.throw(400, t("Incomplete profiles not allowed in this endpoint", { ctx }));
      return;
   }

   return user as User;
}

/**
 * Internal function to add a notification to the user object and optionally send push notification.
 */
export async function addNotificationToUser(
   tokenIdOrUser: TokenIdOrUser,
   notification: NotificationContent,
   settings?: {
      translateNotification?: boolean;
      sendPushNotification?: boolean;
      sendEmailNotification?: boolean;
      /* The email text is the notification text but here you can append extra content */
      emailTextExtraContent?: string;
      channelId?: NotificationChannelId;
      logResult?: boolean;
   },
) {
   let user: Partial<User>;

   if (tokenIdOrUser["user"]) {
      user = tokenIdOrUser["user"];
   } else {
      user = await fromQueryToUser(queryToGetUserByTokenOrId(tokenIdOrUser as TokenOrId), false);
   }

   if (settings?.translateNotification) {
      notification = {
         ...notification,
         title: t(notification.title, { user }),
         text: t(notification.text, { user }),
      };
   }

   if (notification.idForReplacement != null) {
      const previousNotificationIndex = user.notifications.findIndex(
         n => n.idForReplacement === notification.idForReplacement,
      );
      if (previousNotificationIndex > -1) {
         user.notifications.splice(previousNotificationIndex, 1);
      }
   }

   const finalNotification: Notification = {
      ...notification,
      notificationId: generateId(),
      date: moment().unix(),
   };

   user.notifications.push(finalNotification);

   await queryToUpdateUserProps(queryToGetUserByTokenOrId({ userId: user.userId }), [
      {
         key: "notifications",
         value: user.notifications,
      },
   ]);

   // Don't send push notifications on test environment
   if (!isProductionMode() && !ENABLE_PUSH_AND_EMAIL_NOTIFICATIONS_ON_DEBUG_MODE) {
      return;
   }

   if (settings?.sendPushNotification && isValidNotificationsToken(user.notificationsToken)) {
      sendPushNotifications([
         {
            to: user.notificationsToken,
            title: notification.title,
            body: notification.text,
            priority: "high",
            sound: "default", // android 7.0 , 6, 5 , 4
            data: {
               type: notification.type,
               targetId: notification.targetId,
               notificationId: finalNotification.notificationId,
            } as NotificationData,
            channelId: settings.channelId ? settings.channelId : NotificationChannelId.Default,
         },
      ]).then(expoPushTickets => {
         if (LOG_PUSH_NOTIFICATION_DELIVERING_RESULT) {
            // After an hour we log if the notifications were delivered without any error:
            setTimeout(async () => {
               const errors = await getNotificationsDeliveryErrors(expoPushTickets);
               if (errors.length > 0) {
                  errors.forEach(error => console.log(error));
               }
            }, hoursToMilliseconds(1));
         }
      });
   }

   if (settings?.sendEmailNotification) {
      sendEmailNotification({
         user,
         notification: {
            ...notification,
            text: notification.text + " " + (settings?.emailTextExtraContent ?? ""),
         },
      });
   }
}

export async function sendEmailNotification(props: { user: Partial<User>; notification: NotificationContent }) {
   const { user, notification } = props;

   return await sendEmail({
      to: user.email,
      senderName: `${APPLICATION_NAME} app`,
      subject: notification.title,
      html: loadHtmlEmailTemplate({
         variablesToReplace: {
            title: notification.title,
            content: notification.text,
         },
         translationSources: { user },
      }),
   });
}

export async function notificationsGet(params: TokenParameter, ctx: BaseContext): Promise<string> {
   const traversal = queryToGetUserByToken(params.token, null, true);
   return await fromQueryToSpecificPropValue<string>(traversal, "notifications");
}

/**
 * Endpoint to set attraction (like or dislike a user)
 */
export async function setAttractionPost(params: SetAttractionParams, ctx: BaseContext): Promise<void> {
   const attractions = params.attractions;
   const limit = 200;

   if (attractions.length > limit) {
      ctx.throw(400, `More than ${limit} attractions are not allowed on the same request`);
      return;
   }

   await divideArrayCallback(attractions, 50, async attractionsChunk => {
      await sendQuery(() =>
         queryToSetAttraction({ token: params.token, attractions: attractionsChunk }).iterate(),
      );
   });
}

export async function reportUserPost(params: ReportUserPostParams, ctx: BaseContext) {
   const user: Partial<User> = await retrieveUser(params.token as string, false, ctx);
   delete params.token;

   if (user == null) {
      return;
   }

   const reportedUser: Partial<User> = await fromQueryToUser(
      queryToGetUserByTokenOrId({ userId: params.reportedUserId }),
      false,
   );

   if (reportedUser.demoAccount) {
      ctx.throw(400, "Demo accounts can't be reported");
      return;
   }

   const objectToLog: Omit<ReportUserPostParams, "token"> & { reportedBy: string } = {
      ...params,
      reportedBy: user.userId,
   };

   logToFile(JSON.stringify(objectToLog), "usersReported");
}

export async function blockUserPost(params: BlockOrUnblockUserParams, ctx: BaseContext) {
   const user: Partial<User> = await retrieveUser(params.token, false, ctx);

   if (user == null) {
      return;
   }

   const targetUser: Partial<User> = await fromQueryToUser(
      queryToGetUserByTokenOrId({ userId: params.targetUserId }),
      false,
   );

   if (targetUser.demoAccount || user.demoAccount) {
      ctx.throw(400, "Demo accounts cannot block users or be blocked");
      return;
   }

   //TODO: Complete this
}

export async function unblockUserPost(params: BlockOrUnblockUserParams, ctx: BaseContext) {
   const user: Partial<User> = await retrieveUser(params.token as string, false, ctx);

   if (user == null) {
      return;
   }

   const targetUser: Partial<User> = await fromQueryToUser(
      queryToGetUserByTokenOrId({ userId: params.targetUserId }),
      false,
   );

   //TODO: Complete this
}

/**
 * This function is not exposed to the server API. It's only for tests.
 */
export async function matchesGet(token: string): Promise<User[]> {
   return fromQueryToUserList(queryToGetMatches(token), false, false);
}

/**
 * This function is not exposed to the server API. It's only for tests.
 */
export async function attractionsReceivedGet(token: string, types?: AttractionType[]): Promise<User[]> {
   return fromQueryToUserList(queryToGetAttractionsReceived(token, types), false, false);
}

/**
 * This function is not exposed to the server API. It's only for tests.
 */
export async function attractionsSentGet(token: string, types?: AttractionType[]): Promise<User[]> {
   return fromQueryToUserList(queryToGetAttractionsSent(token, types), false, false);
}

/**
 * This endpoint is called when a user requests a SeenMatch to become a Match, so they can be in a
 * group together again. This is useful when the group didn't meet because not enough users wanted
 * to meet but those who wanted to meet can request to be in a group together again.
 * To make the change is required that both users request the change. So the first user requesting
 * is only saved and no change is made.
 */
export async function setSeenPost(params: SetSeenPostParams, ctx: BaseContext): Promise<SetSeenResponse> {
   const { token, setSeenActions } = params;

   const user: Partial<User> = await retrieveUser(token, false, ctx);

   if (user == null) {
      return;
   }

   // This can be optimized by sending the array to the query but this endpoint is not executed very often
   for (const seenAction of setSeenActions) {
      // Other actions are not implemented yet, (like set as seen again)
      if (seenAction.action === SetSeenAction.RequestRemoveSeen) {
         await sendQuery(() =>
            queryToRemoveSeen({
               requesterUserId: user.userId,
               targetUserId: seenAction.targetUserId,
            }).iterate(),
         );
      }
   }

   return { success: true };
}

/**
 * This function is not an endpoint. Is called internally to add a required task to a user.
 * Required tasks is an array in the user props that contains information about the tasks that the user
 * has to complete at login.
 */
export async function createRequiredTaskForUser(params: {
   userId: string;
   task: Omit<RequiredTask, "taskId">;
   notification?: NotificationContent;
   translateNotification?: boolean;
   avoidDuplication?: boolean;
}) {
   const { userId, task, notification, translateNotification, avoidDuplication = true } = params;

   const user = await fromQueryToUser(queryToGetUserById(userId), false);

   if (user == null) {
      return;
   }

   if (avoidDuplication) {
      const existingTask = user.requiredTasks?.find(
         requiredTask => requiredTask.type === task.type && requiredTask.taskInfo === task.taskInfo,
      );
      if (existingTask) {
         return;
      }
   }

   const newRequiredTasks = [...(user.requiredTasks ?? []), { ...task, taskId: generateId() }];

   await sendQuery(() =>
      queryToGetUserById(userId)
         .property(cardinality.single, "requiredTasks", JSON.stringify(newRequiredTasks))
         .iterate(),
   );

   if (notification) {
      await addNotificationToUser({ userId }, notification, {
         sendPushNotification: true,
         translateNotification,
      });
   }
}

/**
 * This endpoint is called to notify that the user completed a required task. Removes the task by taskId.
 * Required tasks is an array in the user props that contains information about the tasks that the user
 * has to complete at login.
 */
export async function taskCompletedPost(
   params: TaskCompletedPostParams,
   ctx: BaseContext,
): Promise<TaskCompletedResponse> {
   const { token, taskId } = params;

   const user: Partial<User> = await retrieveUser(token, false, ctx);

   if (user == null) {
      return;
   }

   const newRequiredTasks = user.requiredTasks.filter(task => task.taskId !== taskId);

   await sendQuery(() =>
      queryToGetUserByToken(params.token)
         .property(cardinality.single, "requiredTasks", JSON.stringify(newRequiredTasks))
         .iterate(),
   );

   return { success: true };
}

export async function deleteAccountPost(
   params: DeleteAccountPostParams,
   ctx: BaseContext,
): Promise<DeleteAccountResponse> {
   const user = await fromQueryToUser(queryToGetUserByToken(params.token), false);

   if (user == null) {
      return;
   }

   if (user.demoAccount) {
      ctx.throw(400, "Demo accounts cannot be deleted");
      return;
   }

   await sendQuery(() => queryToGetUserByTokenOrId({ token: params.token }).drop().iterate());

   const userAfterDeletion = await fromQueryToUser(queryToGetUserByToken(params.token), false);

   return { success: userAfterDeletion == null };
}

export async function createGenders() {
   await sendQuery(() =>
      queryToCreateVerticesFromObjects({
         objects: ALL_GENDERS.map(gender => ({ genderId: gender })),
         label: "gender",
         duplicationAvoidanceProperty: "genderId",
      }).iterate(),
   );
}

export async function sendWelcomeNotification(user: Partial<User>, ctx: BaseContext): Promise<void> {
   if (user?.notifications?.find(n => n.idForReplacement === "welcome") != null) {
      return;
   }

   const notificationContent: Notification = {
      title: t("Welcome to GroupDate!", { ctx }),
      text: t("Press this notification if you are someone curious", { ctx }),
      type: NotificationType.About,
      notificationId: generateId(),
      date: moment().unix(),
      idForReplacement: "welcome",
   };

   await addNotificationToUser({ userId: user.userId }, notificationContent, {
      sendPushNotification: true,
      channelId: NotificationChannelId.Default,
      translateNotification: false,
   });
}

export function isUnwantedUser(props: { propsToCheck?: Partial<User>; tagsIdsToCheck?: string[] }) {
   const { propsToCheck, tagsIdsToCheck } = props;

   if (propsToCheck != null) {
      const unwantedKey = Object.keys(UNWANTED_USERS_PROPS).find(
         key => UNWANTED_USERS_PROPS[key] === propsToCheck[key] && UNWANTED_USERS_PROPS[key] != null,
      );

      if (unwantedKey) {
         return true;
      }
   }

   if (tagsIdsToCheck != null) {
      const unwantedTag = tagsIdsToCheck.find(tagId => UNWANTED_USER_TAG_IDS.includes(tagId));

      if (unwantedTag) {
         return true;
      }
   }

   return false;
}

export async function onImageFileReceived(ctx: ParameterizedContext<{}, {}>, next: Koa.Next): Promise<void> {
   // Only valid users can upload images
   const user: Partial<User> = await retrieveUser(ctx.request.query.token as string, false, ctx);
   if (user == null) {
      return;
   }

   return fileSaverForImages(ctx, next);
}

export async function onImageFileSaved(file: File | undefined, ctx: BaseContext): Promise<FileUploadResponse> {
   if (file == null || file.size === 0) {
      if (file) {
         fs.promises.unlink(file.path);
      }
      ctx.throw(400, t("Invalid file provided", { ctx }));
      return;
   }

   const originalFileExtension: string = path.extname(file.name).toLowerCase();
   const folderPath: string = path.dirname(file.path);
   const fileName: string = path.basename(file.path).replace(originalFileExtension, "");
   const fileNameSmall: string = `${fileName}_small.jpg`;
   const fileNameBig: string = `${fileName}_big.jpg`;
   const fullPathBig: string = `${folderPath}/${fileNameBig}`;
   const fullPathSmall: string = `${folderPath}/${fileNameSmall}`;

   /**
    * Throw error and remove files with invalid extension or format
    */
   if (file.type !== "image/jpeg" && file.type !== "image/png") {
      fs.promises.unlink(file.path);
      ctx.throw(400, t("File format not supported", { ctx }));
      return;
   }

   if (
      originalFileExtension !== ".jpg" &&
      originalFileExtension !== ".jpeg" &&
      originalFileExtension !== ".png"
   ) {
      fs.promises.unlink(file.path);
      ctx.throw(400, t("Attempted to upload a file with wrong extension", { ctx }));
      return;
   }

   /**
    * Resize image to an optimal format.
    * "sharp.fit.outside" setting resizes the image preserving aspect ratio until width or height
    * is equal the the numbers provided.
    */
   await sharp(file.path)
      .resize(BIG_IMAGE_SIZE, BIG_IMAGE_SIZE, { fit: sharp.fit.outside })
      .jpeg()
      .toFile(fullPathBig);

   /**
    * Resize a copy of the image to create a small version to use as profile picture
    * "sharp.fit.outside" setting resizes the image preserving aspect ratio until width or height
    * is equal the the numbers provided.
    */
   await sharp(file.path)
      .resize(SMALL_IMAGE_SIZE, SMALL_IMAGE_SIZE, { fit: sharp.fit.outside })
      .jpeg()
      .toFile(fullPathSmall);

   // Remove the original image file to save disk space:
   fs.promises.unlink(file.path);

   // If using AWS upload to S3
   if (isRunningOnAws()) {
      const fileNameBigInS3 = await uploadFileToS3({
         localFilePath: fullPathBig,
         s3TargetPath: `image-uploads/${fileNameBig}`,
         allowPublicRead: true,
         contentType: "image/jpeg",
      });
      const fileNameSmallInS3 = await uploadFileToS3({
         localFilePath: fullPathSmall,
         s3TargetPath: `image-uploads/${fileNameSmall}`,
         allowPublicRead: true,
         contentType: "image/jpeg",
      });

      fs.promises.unlink(fullPathSmall);
      fs.promises.unlink(fullPathBig);
   }

   return { fileNameSmall, fileNameBig };
}

export const UNWANTED_USER_TAG_IDS = APP_AUTHORED_TAGS_AS_QUESTIONS.map(question =>
   question.answers.filter(answer => answer.unwantedUserAnswer).map(answer => answer.tagId),
).flat();
