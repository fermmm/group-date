import * as appRoot from 'app-root-path';
import { ValidationError } from 'fastest-validator';
import { File } from 'formidable';
import * as fs from 'fs';
import * as Koa from 'koa';
import { ParameterizedContext } from 'koa';
import * as koaBody from 'koa-body';
import * as path from 'path';
import * as sharp from 'sharp';
import { UserRequestParams } from '../../shared-tools/endpoints-interfaces/common';
import {
   FileUploadResponse,
   ProfileStatusServerResponse,
   User,
   UserSetPropsParameters,
} from '../../shared-tools/endpoints-interfaces/user';
import { EditableUserProp, editableUserPropsList, validateUserProps } from '../../shared-tools/validators/user';
import { retreiveUser } from '../common/models';
import { updateUserProp } from '../common/queries';
import { setUserProps } from './queries';
import { questions } from './questions/models';

export async function profileStatusGet(
   params: UserRequestParams,
   ctx: Koa.BaseContext,
): Promise<ProfileStatusServerResponse> {
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

function getMissingEditableUserProps(user: Partial<User>): EditableUserProp[] {
   const result: EditableUserProp[] = [];

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
      if (
         user.questions == null ||
         user.questions.find(uq => {
            return (
               q.questionId === uq.question.questionId && q.answers.find(a => a.answerId === uq.response.answerId) != null
            );
         }) == null
      ) {
         result.push(q.questionId);
      }
   });

   return result;
}

export async function userGet(params: UserRequestParams, ctx: Koa.BaseContext): Promise<Partial<User>> {
   return retreiveUser(params.token, ctx);
}

export async function userPropsPost(params: UserSetPropsParameters, ctx: Koa.BaseContext): Promise<void> {
   const validationResult: true | ValidationError[] = validateUserProps(params.props);
   if (validationResult !== true) {
      ctx.throw(400, JSON.stringify(validationResult));
   }

   setUserProps(params.token, params.props);
}

const imageSaver = koaBody({
   multipart: true,
   formidable: {
      uploadDir: path.join(appRoot.path, '/uploads/'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      onFileBegin: async (name, file) => {
         // Removes upload_ from the file name:
         const fileName = path.basename(file.path).replace('upload_', '');
         file.path = path.join(appRoot.path, '/uploads/') + fileName;
      },
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

export async function onFileSaved(file: File, ctx: Koa.BaseContext): Promise<FileUploadResponse> {
   const originalFileExtension: string = path.extname(file.name).toLowerCase();
   const folderPath: string = path.dirname(file.path);
   const fileName: string = path.basename(file.path).replace(originalFileExtension, '');
   const targetFileNameSmall: string = `${fileName}_small.jpg`;
   const targetFileNameBig: string = `${fileName}_big.jpg`;

   /**
    * Throw error and remove files with invalid extension or format
    */
   if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'Attempted to upload a file with wrong format');
   }

   if (originalFileExtension !== '.jpg' && originalFileExtension !== '.jpeg' && originalFileExtension !== '.png') {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'Attempted to upload a file with wrong extension');
   }

   /**
    * Resize image to an optimal format and create a small version to use as profile picture
    */
   await sharp(file.path)
      .resize(800, 800, { fit: sharp.fit.inside })
      .jpeg()
      .toFile(`${folderPath}/${targetFileNameBig}`);

   await sharp(file.path)
      .resize(64, 64, { fit: sharp.fit.inside })
      .jpeg()
      .toFile(`${folderPath}/${targetFileNameSmall}`);

   // Remove the original image file to save disk space:
   fs.unlinkSync(file.path);

   return {
      fileNameSmall: targetFileNameSmall,
      fileNameBig: targetFileNameBig,
   };
}
