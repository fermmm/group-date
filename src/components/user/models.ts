import * as appRoot from 'app-root-path';
import { ValidationError } from 'fastest-validator';
import { File } from 'formidable';
import * as fs from 'fs';
import * as Koa from 'koa';
import { ParameterizedContext } from 'koa';
import * as koaBody from 'koa-body';
import * as path from 'path';
import * as sharp from 'sharp';
import { removePrivacySensitiveUserProps } from '../../common-tools/security-tools/security-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import {
   FileUploadResponse,
   ProfileStatusServerResponse,
   QuestionWithResponse,
   SetAttractionParams,
   User,
   UserPostParams,
} from '../../shared-tools/endpoints-interfaces/user';
import { editableUserPropsList, ExposedUserPropKey, validateUserProps } from '../../shared-tools/validators/user';
import { retreiveUser } from '../common/models';
import { updateUserProp } from '../common/queries';
import { setAttraction, setUserProps } from './queries';
import { questions } from './questions/models';
import { respondQuestions } from './questions/queries';

export async function profileStatusGet(params: TokenParameter, ctx: Koa.BaseContext): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retreiveUser(params.token, ctx);

   const result: ProfileStatusServerResponse = {
      missingEditableUserProps: getMissingEditableUserProps(user),
      missingQuestionsId: getMissingQuestions(user),
   };

   updateUserProp(
      user.token,
      'profileCompleted',
      result.missingEditableUserProps.length === 0 && result.missingQuestionsId.length === 0,
   );

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

      const responsePresentAndValid: QuestionWithResponse = user.questions.find(uq => {
         const questionPresent: boolean = q.questionId === uq.question.questionId;
         const responseIsValid: boolean = q.answers.find(a => a.answerId === uq.response.answerId) != null;
         return questionPresent && responseIsValid;
      });

      if (responsePresentAndValid == null) {
         result.push(q.questionId);
      }
   });

   return result;
}

export async function userGet(params: TokenParameter, ctx: Koa.BaseContext): Promise<Partial<User>> {
   return removePrivacySensitiveUserProps(await retreiveUser(params.token, ctx));
}

export async function userPost(params: UserPostParams, ctx: Koa.BaseContext): Promise<void> {
   if (params.props != null) {
      const validationResult: true | ValidationError[] = validateUserProps(params.props);
      if (validationResult !== true) {
         ctx.throw(400, JSON.stringify(validationResult));
      }

      await setUserProps(params.token, params.props);
   }

   if (params.questions != null) {
      await respondQuestions(params.token, params.questions);
   }
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
   const user: Partial<User> = await retreiveUser(ctx.request.query.token, ctx);
   if (user == null) {
      return;
   }

   return imageSaver(ctx, next);
}

export async function onFileSaved(file: File | undefined, ctx: Koa.BaseContext): Promise<FileUploadResponse> {
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

   if (originalFileExtension !== '.jpg' && originalFileExtension !== '.jpeg' && originalFileExtension !== '.png') {
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

export async function setAttractionPost(params: SetAttractionParams, ctx: Koa.BaseContext): Promise<void> {
   return setAttraction(params);
}
