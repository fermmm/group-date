import * as multer from '@koa/multer';
import * as appRoot from 'app-root-path';
import { ValidationError } from 'fastest-validator';
import * as fs from 'fs';
import * as Koa from 'koa';
import * as moment from 'moment';
import * as path from 'path';
import { UserRequestParams } from '../../shared-tools/endpoints-interfaces/common';
import { ProfileStatusServerResponse, User, UserSetPropsParameters } from '../../shared-tools/endpoints-interfaces/user';
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

export function setupFileReceiver(): multer.Instance {
   const storage = multer.diskStorage({
      destination: (req, file, cb) => {
         if (!fs.existsSync(appRoot.path + '/uploads')) {
            fs.mkdirSync(appRoot.path + '/uploads');
         }

         cb(null, path.join(appRoot.path, '/uploads/'));
      },
      filename: (req: any, file, cb) => {
         // TODO: Deberia frenar la subida si el archivo es muy grande (habria que usar formidable)
         // TODO: Solo deberia permitir archivos con extension de imagenes o algun filtro similar
         // TODO: Despues de recibir el archivo deberia optimizarlo a unos 800 pixeles de alto o ancho
         // TODO: Deberia tambien guardar una version pequeña para el avatar fijarse el tamaño que usa facebook
         // TODO: Solo un token de usuario valido deberia poder subir imagenes
         console.log(req.body.token);
         cb(null, moment().unix() + file.originalname);
      },
   });

   const limits = {
      fileSize: 500 * 1024 * 1024,
   };

   const fileFilter = (req, file, cb) => {
      const extension: string = path.extname(file.originalname).toLowerCase();
      if (extension !== '.jpg' && extension !== '.jpeg' && extension !== '.png') {
         return cb(null, false);
      }

      cb(null, true);
   };

   return multer({ storage, limits, fileFilter });
}
