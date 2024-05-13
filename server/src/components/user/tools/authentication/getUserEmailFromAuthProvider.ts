import { getEmailFromGoogle } from "./google/getEmailFromGoogle";
import { getTokenInfo } from "../../../../shared-tools/authentication/tokenStringTools";
import { BaseContext } from "koa";
import { getEmailFromFacebook } from "./facebook/getEmailFromFacebook";
import { AuthenticationProvider } from "../../../../shared-tools/authentication/AuthenticationProvider";

export async function getUserEmailFromToken(token: string, ctx: BaseContext) {
   const tokenInfo = getTokenInfo(token);

   switch (tokenInfo.provider) {
      case AuthenticationProvider.Facebook:
         return await getEmailFromFacebook(tokenInfo.originalToken, ctx);
      case AuthenticationProvider.Google:
         return await getEmailFromGoogle(tokenInfo.originalToken, ctx);
      case AuthenticationProvider.Email:
         ctx.throw(401, "Invalid token, please login again");
   }
}
