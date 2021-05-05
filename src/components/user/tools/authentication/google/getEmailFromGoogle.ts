import { BaseContext } from "koa";
import { HttpRequestResponse } from "../../../../../common-tools/database-tools/typing-tools/typing-tools";
import { httpRequest } from "../../../../../common-tools/httpRequest/httpRequest";

export async function getEmailFromGoogle(token: string, ctx: BaseContext) {
   const userDataFromGoogle: HttpRequestResponse<{ email: string }> = await httpRequest({
      url: `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`,
   });

   if (userDataFromGoogle.success === false) {
      ctx.throw(400, userDataFromGoogle.error.message);
      return;
   }

   if (!userDataFromGoogle.content) {
      ctx.throw(400, "userDataFromFacebook.content is null");
      return;
   }

   if (!userDataFromGoogle.content.email) {
      ctx.throw(400, "userDataFromFacebook.content.email is null");
      return;
   }

   return userDataFromGoogle.content.email;
}
