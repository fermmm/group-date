import * as Koa from 'koa';
import { User } from '../../common-tools/endpoints-interfaces/user';
import { httpRequest } from '../../common-tools/httpRequest/httpRequest';
import { HttpRequestResponse } from '../../common-tools/typing-tools/typing-tools';
import { createUser, getUserByEmail, getUserByToken, updateUserToken } from './queries';

/**
 * Tries to get the user using the token and if the user does not exist it creates it.
 * It does the following:
 * 
 * 1. If the database returns the user with the token returns the user and finish
 * 2. If the token does not exist in database asks Facebook for the user email using the token
 * 3. If Facebook does not return a user email when sending the token, then throws error with ctx.throw()
 * 4. If the email returned by Facebook exists in the database replaces the token and returns the user
 * 5. If not, creates a new user saving the email and token, then returns the new user
 * 
 * @param token 
 * @param ctx 
 */
export async function retreiveUser(token: string, ctx: Koa.Context): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await getUserByToken(token);

   if (user != null) {
      return user;
   }

   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(400, userDataFromFacebook.error.message);
   }

   if (!userDataFromFacebook.content || !userDataFromFacebook.content.email) {
      ctx.throw(400, "Facebook error 01");
   }

   user = await getUserByEmail(userDataFromFacebook.content.email);   

   if (user != null) {
      await updateUserToken(userDataFromFacebook.content.email, token);
      return user;
   }

   return createUser(token, userDataFromFacebook.content.email);
}

export interface FacebookResponse {
   id: string;
   email: string;
}