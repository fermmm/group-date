import * as Koa from 'koa';
import { UserRequestParams } from '../../shared-tools/endpoints-interfaces/common';
import {
   ProfileStatusServerResponse,
   RequiredUserProp,
   User,
   UserSetPropsParameters,
} from '../../shared-tools/endpoints-interfaces/user';
import { retreiveUser } from '../common/models';
import { updateUserProp } from '../common/queries';
import { questions } from './questions/models';

const mandatoryUserProps: RequiredUserProp[] = [
   'name',
   'birthdate',
   'targetAgeMin',
   'targetAgeMax',
   'pictures',
   'dateIdeaName',
   'dateIdeaAddress',
   'profileDescription',
   'locationLat',
   'locationLon',
   'gender',
   'genderPreference',
];

export async function profileStatusGet(
   params: UserRequestParams,
   ctx: Koa.Context,
): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retreiveUser(params.token, ctx);
   const result: ProfileStatusServerResponse = {
      missingUserProps: getMissingUserProps(user),
      missingQuestionsId: getMissingQuestions(user),
   };

   updateUserProp(
      user.token,
      'profileCompleted',
      result.missingUserProps.length === 0 && result.missingQuestionsId.length === 0,
   );

   return Promise.resolve(result);
}

function getMissingUserProps(user: Partial<User>): RequiredUserProp[] {
   const result: RequiredUserProp[] = [];

   mandatoryUserProps.forEach(mandatoryProp => {
      if (user[mandatoryProp] == null) {
         result.push(mandatoryProp);
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
               q.questionId === uq.question.questionId &&
               q.answers.find(a => a.answerId === uq.response.answerId) != null
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

export async function userPost(params: UserSetPropsParameters, ctx: Koa.Context): Promise<void> {
   // TODO: Validar con fastest-validator

   const user: Partial<User> = await retreiveUser(params.token, ctx);
   return Promise.resolve();
}
