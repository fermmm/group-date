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
import { HttpRequestResponse } from "../../common-tools/database-tools/typing-tools/typing-tools";
import { createFolderOnRoot } from "../../common-tools/files-tools/files-tools";
import { httpRequest } from "../../common-tools/httpRequest/httpRequest";
import { FacebookResponse, TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import {
   AttractionType,
   FileUploadResponse,
   Notification,
   ProfileStatusServerResponse,
   SetAttractionParams,
   User,
   UserPostParams,
   UserPropAsQuestion,
   UserPropsAsQuestionsTypes,
} from "../../shared-tools/endpoints-interfaces/user";
import {
   editableUserPropsList,
   EditableUserPropKey,
   validateUserProps,
} from "../../shared-tools/validators/user";
import {
   queryToCreateUser,
   queryToGetAttractionsReceived,
   queryToGetAttractionsSent,
   queryToGetMatches,
   queryToGetUserByEmail,
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
import { getNotShowedQuestionIds } from "../themes/models";
import { MAX_FILE_SIZE_UPLOAD_ALLOWED, USER_PROPS_AS_QUESTIONS } from "../../configurations";

export async function initializeUsers(): Promise<void> {
   createFolderOnRoot("uploads");
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
 * @param includeFullInfo Includes themes data
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

   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`,
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(400, userDataFromFacebook.error.message);
      return;
   }

   if (!userDataFromFacebook.content || !userDataFromFacebook.content.email) {
      ctx.throw(400, "Facebook error 01");
      return;
   }

   user = await fromQueryToUser(queryToGetUserByEmail(userDataFromFacebook.content.email), includeFullInfo);

   if (user != null) {
      await queryToUpdateUserToken(userDataFromFacebook.content.email, token);
      return user;
   }

   return fromQueryToUser(queryToCreateUser(token, userDataFromFacebook.content.email), includeFullInfo);
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
      notShowedThemeQuestions: getNotShowedQuestionIds(user),
      user,
   };

   await queryToUpdateUserProps(user.token, [
      {
         key: "profileCompleted",
         value: result.missingEditableUserProps.length === 0 && result.notShowedThemeQuestions.length === 0,
      },
      {
         key: "lastLoginDate",
         value: moment().unix(),
      },
      {
         key: "language",
         value: getLocaleFromHeader(ctx),
      },
   ]);

   return result;
}

function getMissingEditableUserProps(user: Partial<User>): EditableUserPropKey[] {
   const result: EditableUserPropKey[] = [];

   editableUserPropsList.forEach(editableUserProp => {
      if (user[editableUserProp] == null) {
         result.push(editableUserProp);
      }
   });

   return result;
}

export function userPropsAsQuestionsGet(
   ctx: BaseContext,
): Array<UserPropAsQuestion<UserPropsAsQuestionsTypes>> {
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
 * This endpoint retrieves the user info and is meant to be called only by the person corresponding
 * to the user (token only) because it returns private information.
 */
export async function userGet(params: TokenParameter, ctx: BaseContext): Promise<Partial<User>> {
   return await retrieveUser(params.token, true, ctx);
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
      ctx.throw(400, t("Incomplete profiles not allowed in this endpoint", { user }));
      return;
   }

   return user as User;
}

/**
 * Internal function to add a notification to the user object.
 */
export async function addNotificationToUser(
   tokenOrId: TokenOrId,
   notification: Omit<Notification, "notificationId" | "date">,
   translateNotification?: boolean,
) {
   const user: Partial<User> = await fromQueryToUser(queryToGetUserByTokenOrId(tokenOrId), false);

   if (translateNotification) {
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

   user.notifications.push({
      ...notification,
      notificationId: generateId(),
      date: moment().unix(),
   });

   await queryToUpdateUserProps(queryToGetUserByTokenOrId(tokenOrId), [
      {
         key: "notifications",
         value: user.notifications,
      },
   ]);
}

/**
 * Endpoint to set attraction (like or dislike a user)
 */
export async function setAttractionPost(params: SetAttractionParams, ctx: BaseContext): Promise<void> {
   const attractions = params.attractions;

   await divideArrayCallback(attractions, 50, async attractionsChunk => {
      await sendQuery(() =>
         queryToSetAttraction({ token: params.token, attractions: attractionsChunk }).iterate(),
      );
   });
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
   const user: Partial<User> = await retrieveUser(ctx.request.query.token, false, ctx);
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
    * Resize image to an optimal format and create a small version to use as profile picture
    */
   await sharp(file.path)
      .resize(512, 512, { fit: sharp.fit.inside })
      .jpeg()
      .toFile(`${folderPath}/${fileNameBig}`);

   await sharp(file.path)
      .resize(64, 64, { fit: sharp.fit.inside })
      .jpeg()
      .toFile(`${folderPath}/${fileNameSmall}`);

   // Remove the original image file to save disk space:
   fs.unlinkSync(file.path);

   return { fileNameSmall, fileNameBig };
}
