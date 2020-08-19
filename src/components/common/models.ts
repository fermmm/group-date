import { BaseContext } from 'koa';
import { HttpRequestResponse } from '../../common-tools/database-tools/typing-tools/typing-tools';
import { httpRequest } from '../../common-tools/httpRequest/httpRequest';
import { FacebookResponse } from '../../shared-tools/endpoints-interfaces/common';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { queryToCreateUser } from '../user/queries';
import { fromQueryToUser } from '../user/tools/data-conversion';
import { queryToGetUserByEmail, queryToGetUserByToken, queryToUpdateUserToken } from './queries';

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
export async function retrieveUser(
   token: string,
   includeQuestionsData: boolean,
   ctx: BaseContext,
): Promise<Partial<User>> {
   let user: Partial<User> = null;

   user = await fromQueryToUser(queryToGetUserByToken(token), includeQuestionsData);

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

   user = await fromQueryToUser(
      queryToGetUserByEmail(userDataFromFacebook.content.email),
      includeQuestionsData,
   );

   if (user != null) {
      await queryToUpdateUserToken(userDataFromFacebook.content.email, token);
      return user;
   }

   return fromQueryToUser(queryToCreateUser(token, userDataFromFacebook.content.email), includeQuestionsData);
}

/**
 * Calls retrieveUser and returns the same thing, but if profileCompleted is not true throws error
 *
 * @param token Token from the Facebook login in the client application
 * @param ctx
 */
export async function retrieveFullyRegisteredUser(
   token: string,
   includeQuestionsData: boolean,
   ctx: BaseContext,
): Promise<User> {
   const user = await retrieveUser(token, includeQuestionsData, ctx);

   if (!user.profileCompleted) {
      ctx.throw(400, 'Incomplete profiles not allowed in this endpoint');
   }

   return user as User;
}
