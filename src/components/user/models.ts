import * as Koa from 'koa';
import { UserRequestParams } from '../../common-tools/endpoints-interfaces/common';
import { ProfileStatusServerResponse, RequiredUserProp, User } from '../../common-tools/endpoints-interfaces/user';
import { retreiveUser } from '../common/models';

const mandatoryUserProps: RequiredUserProp[] = [
   "name",
   "birthdate",
   "targetAgeMin",
   "targetAgeMax",
   "pictures",
   "dateIdeaName",
   "dateIdeaAddress",
   "profileDescription",
   "locationLat",
   "locationLon",
   "gender",
   "genderPreference",
];

export async function profileStatusGet(params: UserRequestParams, ctx: Koa.Context): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retreiveUser(params.token, ctx);
   const result: ProfileStatusServerResponse = {
      missingUserProps: getMissingUserProps(user),
      missingQuestionsId: getMissingQuestions(user)
   }

   // TODO: Aca si el usuario esta completo setear user.profileCompleted = true llamando directo a una query

   return Promise.resolve(result);
}

function getMissingUserProps(user: Partial<User>): RequiredUserProp[] {
   const result: RequiredUserProp[] = [];

   for (const mandatoryProp of mandatoryUserProps) {      
      if(user[mandatoryProp] == null) {
         result.push(mandatoryProp);
      }
   }

   return result;
}

function getMissingQuestions(user: Partial<User>): number[] {
   const result: number[] = [];
   
   // TODO: Hacer una query para crear los vertex con las preguntas
   // TODO: Hacer una query para responder una pregunta
   // TODO: Hacer una query para obtener las preguntas respondidas

   result.push()

   return result;
}