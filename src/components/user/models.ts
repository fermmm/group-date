import { ValidationError } from 'fastest-validator';
import * as Koa from 'koa';
import { UserRequestParams } from '../../shared-tools/endpoints-interfaces/common';
import { ProfileStatusServerResponse, User, UserSetPropsParameters } from '../../shared-tools/endpoints-interfaces/user';
import { EditableUserProp, editableUserPropsList, validateUserProps } from '../../shared-tools/validators/user';
import { retreiveUser } from '../common/models';
import { updateUserProp } from '../common/queries';
import { questions } from './questions/models';

export async function profileStatusGet(params: UserRequestParams, ctx: Koa.Context): Promise<ProfileStatusServerResponse> {
   // TODO: Implementar los generos

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

export async function userGet(params: UserRequestParams, ctx: Koa.Context): Promise<Partial<User>> {
   return retreiveUser(params.token, ctx);
}

export async function userPropsPost(params: UserSetPropsParameters, ctx: Koa.Context): Promise<void> {
   const validationResult: true | ValidationError[] = validateUserProps(params.props);
   if (validationResult !== true) {
      ctx.throw(400, JSON.stringify(validationResult));
   }

   const user: Partial<User> = await retreiveUser(params.token, ctx);

   // TODO: Loopear editableUserPropsList y si la prop esta presente en el objeto recibido se agrega
   // esto evita loopear una lista random gigante que puedan mandar si quieren atacar
   editableUserPropsList.forEach(editableUserProp => {
      if (params.props[editableUserProp] != null) {
         /**
          * Agregar
          * key: editableUserProp
          * value:  params.props[editableUserProp]
          */
      }
   });
   return Promise.resolve();
}
