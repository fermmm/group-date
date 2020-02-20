import * as Koa from 'koa';
import { UserRequestParams } from '../../common-tools/endpoints-interfaces/user';
import { 
   ProfileStatusServerResponse, 
   RegistrationStepScreen 
} from '../../common-tools/endpoints-interfaces/user';
import { httpRequest } from '../../common-tools/httpRequest/httpRequest';
import { HttpRequestResponse } from '../../common-tools/typing-tools/typing-tools';
import { createUser, getUserByEmail, getUserByToken, updateUserToken } from './queries';

export async function profileStatusGet(params: UserRequestParams, ctx: Koa.Context): Promise<ProfileStatusServerResponse> {
   const user: Partial<User> = await retreiveUser(params.token, ctx);
   console.log(user);

   return Promise.resolve({
      missingRegistrationStep: {
         screenType: RegistrationStepScreen.BasicInfo,
         screenData: null
      },
   });
}

/**
 * Tries to get the user using the token and if the user does not exist it creates it.
 * Also solves the problems that can happen in this order:
 * 
 * 1. If the database returns the user with the token returns the user
 * 2. If the token does not exist in database asks Facebook for the user email using the token
 * 3. If Facebook does not return a user email when sending the token, then throws error with ctx.throw()
 * 4. If the email returned by Facebook exists in the database replaces the token and returns the user
 * 5. If not, creates a new user saving the email and token, then returns the new user
 * 
 * @param token 
 * @param ctx 
 */
async function retreiveUser(token: string, ctx: Koa.Context): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await getUserByToken(token);

   if (user != null) {
      return user;
   }

   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(userDataFromFacebook.error.message, 500);
   }

   if (!userDataFromFacebook.content || !userDataFromFacebook.content.email) {
      ctx.throw("Facebook error 01", 500);
   }

   user = await getUserByEmail(userDataFromFacebook.content.email);   

   if (user != null) {
      await updateUserToken(userDataFromFacebook.content.email, token);
      return user;
   }

   return createUser(token, userDataFromFacebook.content.email);
}

// TODO: Terminarlo?
export interface User {
   id: number;
   token: string;
   email: string;
   name: string;
   birthdate: Date;
   targetAgeMin: number;
   targetAgeMax: number;
   pictures: string[];
   height?: number;
   dateIdeaName: string;
   dateIdeaAddress: string;
   profileDescription: string;
}

export interface FacebookResponse {
   id: string;
   email: string;
}