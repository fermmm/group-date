import {
   NotificationData,
   NotificationContent,
   ReportUserPostParams,
   Gender,
} from "./../../shared-tools/endpoints-interfaces/user";
import { isValidNotificationsToken } from "./../../common-tools/push-notifications/push-notifications";
import { removePrivacySensitiveUserProps } from "./../../common-tools/security-tools/security-tools";
import * as appRoot from "app-root-path";
import { ValidationError } from "fastest-validator";
import { File } from "formidable";
import * as fs from "fs";
import * as Koa from "koa";
import { BaseContext, ParameterizedContext } from "koa";
import * as koaBody from "koa-body";
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
   queryToSetAttraction,
   queryToSetUserProps,
   queryToUpdateUserProps,
   queryToUpdateUserToken,
} from "./queries";
import { fromQueryToUser, fromQueryToUserList } from "./tools/data-conversion";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { sendQuery } from "../../common-tools/database-tools/database-manager";
import { divideArrayCallback } from "../../common-tools/js-tools/js-tools";
import { getLocaleFromHeader, t } from "../../common-tools/i18n-tools/i18n-tools";
import { queryToGetUserByTokenOrId } from "./queries";
import { TokenOrId } from "./tools/typings";
import { getNotShowedQuestionIds } from "../tags/models";
import {
   BIG_IMAGE_SIZE,
   MAX_FILE_SIZE_UPLOAD_ALLOWED,
   SMALL_IMAGE_SIZE,
   USER_PROPS_AS_QUESTIONS,
} from "../../configurations";
import { getAmountOfUsersCount, updateAmountOfUsersCount } from "../admin/models";
import { fromQueryToSpecificPropValue } from "../../common-tools/database-tools/data-conversion-tools";
import { sendPushNotifications } from "../../common-tools/push-notifications/push-notifications";
import { getUserEmailFromAuthProvider } from "./tools/authentication/getUserEmailFromAuthProvider";
import { getUserGenderSelection } from "../../shared-tools/user-tools/getUserGenderSelection";

export async function initializeUsers(): Promise<void> {
   createFolder("uploads");
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
   const email = await getUserEmailFromAuthProvider(token, ctx);

   user = await fromQueryToUser(queryToGetUserByEmail(email), includeFullInfo);

   if (user != null) {
      await queryToUpdateUserToken(email, token);
      return { ...user, token };
   }

   return createUser(token, email, includeFullInfo, ctx);
}

export async function createUser(
   token: string,
   email: string,
   includeFullInfo: boolean,
   ctx: BaseContext,
   setProfileCompletedForTesting?: boolean,
   customUserIdForTesting?: string,
): Promise<Partial<User>> {
   let isAdmin = false;

   // The first user registered is set automatically to be admin, just double check that is the first user
   if (getAmountOfUsersCount() === 0) {
      await updateAmountOfUsersCount();

      if (getAmountOfUsersCount() === 0) {
         isAdmin = true;
      }
   }

   const welcomeNotification: Notification = getWelcomeNotification(ctx);

   return fromQueryToUser(
      queryToCreateUser(
         token,
         email,
         welcomeNotification,
         setProfileCompletedForTesting,
         customUserIdForTesting,
         isAdmin,
      ),
      includeFullInfo,
   );
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
   const genderTagsOfUser = getUserGenderSelection(user);

   const result: ProfileStatusServerResponse = {
      missingEditableUserProps: getMissingEditableUserProps(user),
      notShowedTagQuestions: getNotShowedQuestionIds(user),
      genderIsSelected: genderTagsOfUser.subscribed.length > 0,
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
      if (user[editableUserProp] == null) {
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
 * This endpoint should be used to send the user props.
 */
export async function userPost(params: UserPostParams, ctx: BaseContext): Promise<void> {
   let query: Traversal = queryToGetUserByToken(params.token);

   if (params.props != null) {
      const validationResult: true | ValidationError[] = validateUserProps(params.props);
      if (validationResult !== true) {
         ctx.throw(400, JSON.stringify(validationResult));
         return;
      }

      query = queryToSetUserProps(query, params.props);
   }

   await sendQuery(() => query.iterate());

   if (params.updateProfileCompletedProp) {
      const user = await retrieveUser(params.token, false, ctx);
      await sendQuery(() =>
         queryToGetUserByToken(params.token)
            .property("profileCompleted", profileStatusIsCompleted(user))
            .iterate(),
      );
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
   tokenOrId: TokenOrId,
   notification: NotificationContent,
   settings?: {
      translateNotification?: boolean;
      sendPushNotification?: boolean;
      channelId?: NotificationChannelId;
   },
) {
   const user: Partial<User> = await fromQueryToUser(queryToGetUserByTokenOrId(tokenOrId), false);

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

   await queryToUpdateUserProps(queryToGetUserByTokenOrId(tokenOrId), [
      {
         key: "notifications",
         value: user.notifications,
      },
   ]);

   if (settings?.sendPushNotification && isValidNotificationsToken(user.notificationsToken)) {
      sendPushNotifications([
         {
            to: user.notificationsToken,
            title: notification.title,
            body: notification.text,
            data: {
               type: notification.type,
               targetId: notification.targetId,
               notificationId: finalNotification.notificationId,
            } as NotificationData,
            channelId: settings.channelId ? settings.channelId : NotificationChannelId.Default,
         },
      ]);
   }
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
   if (user == null) {
      return;
   }

   delete params.token;

   const objectToLog: Omit<ReportUserPostParams, "token"> & { reportedBy: string } = {
      ...params,
      reportedBy: user.userId,
   };

   logToFile(JSON.stringify(objectToLog), "usersReported");
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

export function getWelcomeNotification(ctx: BaseContext): Notification {
   return {
      title: t("Welcome to the app!", { ctx }),
      text: t("Press here if you want to know more details", { ctx }),
      type: NotificationType.About,
      notificationId: generateId(),
      date: moment().unix(),
   };
}

const imageSaver = koaBody({
   multipart: true,
   formidable: {
      uploadDir: path.join(appRoot.path, "/uploads/"),
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE_UPLOAD_ALLOWED,
   },
   onError: (error, ctx) => {
      ctx.throw(400, error);
   },
});

export async function onFileReceived(ctx: ParameterizedContext<{}, {}>, next: Koa.Next): Promise<void> {
   // Only valid users can upload images
   const user: Partial<User> = await retrieveUser(ctx.request.query.token as string, false, ctx);
   if (user == null) {
      return;
   }

   return imageSaver(ctx, next);
}

export async function onFileSaved(file: File | undefined, ctx: BaseContext): Promise<FileUploadResponse> {
   if (file == null || file.size === 0) {
      if (file) {
         fs.unlinkSync(file.path);
      }
      ctx.throw(400, t("Invalid file provided", { ctx }));
      return;
   }

   const originalFileExtension: string = path.extname(file.name).toLowerCase();
   const folderPath: string = path.dirname(file.path);
   const fileName: string = path.basename(file.path).replace(originalFileExtension, "");
   const fileNameSmall: string = `${fileName}_small.jpg`;
   const fileNameBig: string = `${fileName}_big.jpg`;

   /**
    * Throw error and remove files with invalid extension or format
    */
   if (file.type !== "image/jpeg" && file.type !== "image/png") {
      fs.unlinkSync(file.path);
      ctx.throw(400, t("File format not supported", { ctx }));
      return;
   }

   if (
      originalFileExtension !== ".jpg" &&
      originalFileExtension !== ".jpeg" &&
      originalFileExtension !== ".png"
   ) {
      fs.unlinkSync(file.path);
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
      .toFile(`${folderPath}/${fileNameBig}`);

   /**
    * Resize a copy of the image to create a small version to use as profile picture
    * "sharp.fit.outside" setting resizes the image preserving aspect ratio until width or height
    * is equal the the numbers provided.
    */
   await sharp(file.path)
      .resize(SMALL_IMAGE_SIZE, SMALL_IMAGE_SIZE, { fit: sharp.fit.outside })
      .jpeg()
      .toFile(`${folderPath}/${fileNameSmall}`);

   // Remove the original image file to save disk space:
   fs.unlinkSync(file.path);

   return { fileNameSmall, fileNameBig };
}
