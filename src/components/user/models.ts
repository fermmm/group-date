import * as appRoot from 'app-root-path';
import { ValidationError } from 'fastest-validator';
import { File } from 'formidable';
import * as fs from 'fs';
import * as Koa from 'koa';
import { BaseContext, ParameterizedContext } from 'koa';
import * as koaBody from 'koa-body';
import * as moment from 'moment';
import * as path from 'path';
import * as sharp from 'sharp';
import { v1 as uuidv1 } from 'uuid';
import { HttpRequestResponse } from '../../common-tools/database-tools/typing-tools/typing-tools';
import { httpRequest } from '../../common-tools/httpRequest/httpRequest';
import { FacebookResponse, TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import {
   AttractionType,
   FileUploadResponse,
   Notification,
   ProfileStatusServerResponse,
   QuestionResponse,
   SetAttractionParams,
   User,
   UserPostParams,
} from '../../shared-tools/endpoints-interfaces/user';
import {
   editableUserPropsList,
   ExposedUserPropKey,
   validateUserProps,
} from '../../shared-tools/validators/user';
import {
   queryToCreateUser,
   queryToGetAttractionsReceived,
   queryToGetAttractionsSent,
   queryToGetMatches,
   queryToGetUserByEmail,
   queryToGetUserByToken,
   queryToSetAttraction,
   queryToSetUserEditableProps,
   queryToUpdateUserProps,
   queryToUpdateUserToken,
} from './queries';
import { questions } from './questions/models';
import { respondQuestions } from './questions/queries';
import { fromQueryToUser, fromQueryToUserList } from './tools/data-conversion';

/**
 * This endpoint returns all user props that are missing, only when this endpoint returns empty arrays
 * the user can proceed with the endpoints not related with registration.
 * If the user does not exist this endpoint creates it and it should be used also for the user creation.
 */
export async function profileStatusGet(
   params: TokenParameter,
   ctx: BaseContext,
): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retrieveUser(params.token, true, ctx);

   const result: ProfileStatusServerResponse = {
      missingEditableUserProps: getMissingEditableUserProps(user),
      missingQuestionsId: getMissingQuestions(user),
   };

   queryToUpdateUserProps(user.token, [
      {
         key: 'profileCompleted',
         value: result.missingEditableUserProps.length === 0 && result.missingQuestionsId.length === 0,
      },
      {
         key: 'lastLoginDate',
         value: moment().unix(),
      },
   ]);

   return Promise.resolve(result);
}

function getMissingEditableUserProps(user: Partial<User>): ExposedUserPropKey[] {
   const result: ExposedUserPropKey[] = [];

   editableUserPropsList.forEach(editableUserProp => {
      if (user[editableUserProp] == null) {
         result.push(editableUserProp);
      }
   });

   return result;
}

function getMissingQuestions(user: Partial<User>): number[] {
   const result: number[] = [];
   questions.forEach(q => {
      if (user.questions == null) {
         result.push(q.questionId);
         return;
      }

      const answerPresentAndValid: QuestionResponse = user.questions.find(uq => {
         const questionPresent: boolean = q.questionId === uq.questionId;
         const answerIsValid: boolean = q.answers.find(a => a.answerId === uq.answerId) != null;
         return questionPresent && answerIsValid;
      });

      if (answerPresentAndValid == null) {
         result.push(q.questionId);
      }
   });

   return result;
}

/**
 * This endpoint retrieves the user info and is meant to be called only by the person corresponding
 * to the user (token only) because it returns private information.
 */
export async function userGet(params: TokenParameter, ctx: BaseContext): Promise<Partial<User>> {
   return await retrieveUser(params.token, true, ctx);
}

/**
 * This endpoint should be used to send the user props and questions.
 */
export async function userPost(params: UserPostParams, ctx: BaseContext): Promise<void> {
   if (params.props != null) {
      const validationResult: true | ValidationError[] = validateUserProps(params.props);
      if (validationResult !== true) {
         ctx.throw(400, JSON.stringify(validationResult));
      }

      await queryToSetUserEditableProps(params.token, params.props);
   }

   if (params.questions != null) {
      await respondQuestions(params.token, params.questions);
   }
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
 * @param ctx
 */
export async function retrieveUser(
   token: string,
   includeQuestionsData: boolean,
   ctx: BaseContext,
): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await fromQueryToUser(queryToGetUserByToken(token), includeQuestionsData);

   if (user != null) {
      return user;
   }

   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`,
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(400, userDataFromFacebook.error.message);
   }

   if (!userDataFromFacebook.content || !userDataFromFacebook.content.email) {
      ctx.throw(400, 'Facebook error 01');
   }

   user = await fromQueryToUser(
      queryToGetUserByEmail(userDataFromFacebook.content.email),
      includeQuestionsData,
   );

   if (user != null) {
      await queryToUpdateUserToken(userDataFromFacebook.content.email, token);
      return user;
   }

   return fromQueryToUser(queryToCreateUser(token, userDataFromFacebook.content.email), includeQuestionsData);
}

/**
 * Calls retrieveUser and returns the same thing, but if profileCompleted is not true throws error
 *
 * @param token Token from the Facebook login in the client application
 * @param ctx
 */
export async function retrieveFullyRegisteredUser(
   token: string,
   includeQuestionsData: boolean,
   ctx: BaseContext,
): Promise<User> {
   const user = await retrieveUser(token, includeQuestionsData, ctx);

   if (!user.profileCompleted) {
      ctx.throw(400, 'Incomplete profiles not allowed in this endpoint');
   }

   return user as User;
}

/**
 * Internal function to add a notification to the user object.
 */
export async function addNotificationToUser(
   token: string,
   notification: Omit<Notification, 'notificationId' | 'date'>,
) {
   const user: Partial<User> = await retrieveUser(token, false, null);

   user.notifications.push({
      ...notification,
      notificationId: uuidv1(),
      date: moment().unix(),
   });

   await queryToUpdateUserProps(token, [
      {
         key: 'notifications',
         value: user.notifications,
      },
   ]);
}

/**
 * Endpoint to set attraction (like or dislike a user)
 */
export async function setAttractionPost(params: SetAttractionParams, ctx: BaseContext): Promise<void> {
   return await queryToSetAttraction(params).iterate();
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
      uploadDir: path.join(appRoot.path, '/uploads/'),
      keepExtensions: true,
      maxFileSize: 0.3 * 1024 * 1024,
   },
   onError: (error, ctx) => {
      ctx.throw(400, error);
   },
});

export async function onFileReceived(ctx: ParameterizedContext<{}, {}>, next: Koa.Next): Promise<void> {
   // Only valid users can upload pictures
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
      ctx.throw(400, 'Invalid file provided');
   }

   const originalFileExtension: string = path.extname(file.name).toLowerCase();
   const folderPath: string = path.dirname(file.path);
   const fileName: string = path.basename(file.path).replace(originalFileExtension, '');
   const fileNameSmall: string = `${fileName}_small.jpg`;
   const fileNameBig: string = `${fileName}_big.jpg`;

   /**
    * Throw error and remove files with invalid extension or format
    */
   if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'File format not supported');
   }

   if (
      originalFileExtension !== '.jpg' &&
      originalFileExtension !== '.jpeg' &&
      originalFileExtension !== '.png'
   ) {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'Attempted to upload a file with wrong extension');
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
