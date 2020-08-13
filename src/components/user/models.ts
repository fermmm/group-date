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
import { fromQueryToUserList } from '../../common-tools/database-tools/data-conversion-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
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
import { retrieveUser } from '../common/models';
import { queryToUpdateUserProps } from '../common/queries';
import {
   queryToGetAttractionsReceived,
   queryToGetAttractionsSent,
   queryToGetMatches,
   queryToSetAttraction,
   queryToSetUserEditableProps,
} from './queries';
import { questions } from './questions/models';
import { respondQuestions } from './questions/queries';

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
