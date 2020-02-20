import * as Koa from 'koa';
import { UserRequestParams } from '../../common-tools/endpoints-interfaces/common';
import { 
   ProfileStatusServerResponse, RequiredUserProp 
} from '../../common-tools/endpoints-interfaces/user';
import { retreiveUser, User } from '../common/models';

const mandatoryUserProps: RequiredUserProp[] = [
   "name",
   "birthdate",
   "targetAgeMin",
   "targetAgeMax",
   "pictures",
   "dateIdeaName",
   "dateIdeaAddress",
   "profileDescription"
];

export async function profileStatusGet(params: UserRequestParams, ctx: Koa.Context): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retreiveUser(params.token, ctx);
   const missingProp: RequiredUserProp = getFirstMissingUserProp(user);

   if (missingProp == null) {
      return Promise.resolve({
         missingUserProp: null,
      });
   }

   return Promise.resolve({
      missingUserProp: {
         prop: missingProp,
         questionData: null
      },
   });
}

function getFirstMissingUserProp(user: Partial<User>): RequiredUserProp | null {
   for (const prop of mandatoryUserProps) {
      if(user[prop] == null) {
         return prop;
      }
   }

   // TODO: Add questions to the return value of this function
   return null;
}