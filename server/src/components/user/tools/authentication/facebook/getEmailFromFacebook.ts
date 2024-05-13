import { BaseContext } from "koa";
import { HttpRequestResponse } from "../../../../../common-tools/database-tools/typing-tools/typing-tools";
import { httpRequest } from "../../../../../common-tools/httpRequest/httpRequest";

export async function getEmailFromFacebook(token: string, ctx: BaseContext) {
   const userDataFromFacebook: HttpRequestResponse<FacebookResponse> = await httpRequest({
      url: `https://graph.facebook.com/me?fields=email&access_token=${token}`,
   });

   if (userDataFromFacebook.success === false) {
      ctx.throw(401, userDataFromFacebook.error.message);
      return;
   }

   if (!userDataFromFacebook.content) {
      ctx.throw(401, "userDataFromFacebook.content is null");
      return;
   }

   if (!userDataFromFacebook.content.email) {
      ctx.throw(401, "userDataFromFacebook.content.email is null");
      return;
   }

   return userDataFromFacebook.content.email;
}

interface FacebookResponse {
   id: string;
   email: string;
}
