import * as Koa from 'koa';
import { httpRequest } from '../../common-tools/httpRequest/httpRequest';
import { HttpRequestResponse } from '../../common-tools/typing-tools/typing-tools';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { createUser, getUserByEmail, getUserByToken, updateUserToken } from './queries';

/**
 * Tries to get the user using the Facebook token and if the user does not exist it creates it.
 * It does the following in order:
 *
 * 1. If the database finds the user with the provided token returns the user and that's all
 * 2. If the token does not exist in database then sends the token to Facebook to try to get the user email
 * 3. If Facebook does not return the email of the user it means the token is invalid: throws error (ctx.throw)
 * 4. If using the email the database finds a user then replaces token cached and returns the user
 * 5. If not, it means we are dealing with a new user, so it creates it with the email and token and returns it
 *
 * @param token Token from the Facebook login in the client application
 * @param ctx
 */
export async function retreiveUser(token: string, ctx: Koa.BaseContext): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await getUserByToken(token);

   if (user != null) {
      return user;
   }

   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`,
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(400, userDataFromFacebook.error.message);
   }

   if (!userDataFromFacebook.content || !userDataFromFacebook.content.email) {
      ctx.throw(400, 'Facebook error 01');
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
