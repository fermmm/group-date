import * as appRoot from 'app-root-path';
import { ValidationError } from 'fastest-validator';
import { File } from 'formidable';
import * as fs from 'fs';
import * as Koa from 'koa';
import { ParameterizedContext } from 'koa';
import * as koaBody from 'koa-body';
import * as path from 'path';
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

const koaBodyConfig = koaBody({
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
   // TODO: Despues de recibir el archivo deberia optimizarlo a unos 800 pixeles de alto o ancho
   // TODO: Deberia tambien guardar una version pequeña para el avatar fijarse el tamaño que usa facebook

   const user: Partial<User> = await retreiveUser(ctx.request.query.token, ctx);

   if (user == null) {
      return;
   }
   return koaBodyConfig(ctx, next);
}

export function onFileSaved(file: File, ctx: Koa.BaseContext): FileUploadResponse {
   const extension: string = path.extname(file.name).toLowerCase();

   if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'Attempted to upload a file with wrong format');
   }

   if (extension !== '.jpg' && extension !== '.jpeg' && extension !== '.png') {
      fs.unlinkSync(file.path);
      ctx.throw(400, 'Attempted to upload a file with wrong extension');
   }

   return {
      fileName: path.basename(file.path),
   };
}
