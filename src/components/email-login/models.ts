import { BaseContext } from "koa";
import { has } from "typescript-collections/dist/lib/util";
import {
   compareEncryption,
   decode,
   encode,
   encrypt,
} from "../../common-tools/cryptography-tools/cryptography-tools";
import { sendEmail } from "../../common-tools/email-tools/email-tools";
import { tryToGetErrorMessage } from "../../common-tools/httpRequest/tools/tryToGetErrorMessage";
import { t } from "../../common-tools/i18n-tools/i18n-tools";
import { getServerUrl } from "../../common-tools/url-tools/getServerUrl";
import { APPLICATION_NAME } from "../../configurations";
import {
   ChangePasswordCredentials,
   ChangePasswordPostParams,
   ChangePasswordResponse,
   ConfirmEmailParams,
   ConfirmEmailResponse,
   CreateAccountParams,
   CreateAccountResponse,
   EmailLoginCredentials,
   LoginGetParams,
   LoginResponse,
   ResetPasswordPostParams,
} from "../../shared-tools/endpoints-interfaces/email-login";
import { createUser, retrieveUser } from "../user/models";
import {
   queryToGetUserByEmail,
   queryToGetUserById,
   queryToGetUserByToken,
   queryToUpdateUserToken,
} from "../user/queries";
import { fromQueryToUser } from "../user/tools/data-conversion";

/**
 * This endpoint is executed by the client app when the user wants to create an account, after typing the email and password.
 * Sends an email to verify ownership of the email account. The email contains a link to a website with the email and password
 * encoded in the url. The website sends the hash back to the confirmEmailPost() endpoint to create the user.
 */
export async function createAccountPost(
   params: CreateAccountParams,
   ctx: BaseContext,
): Promise<CreateAccountResponse> {
   const { email, password } = params;

   if (email?.length < 4 || !email.includes("@") || password?.length < 1) {
      ctx.throw(400, "Invalid credentials");
      return;
   }

   // TODO: Esta url es una pagina web asi que SARASAAAAA hay que reemplazarlo por el path
   try {
      await sendEmail({
         to: email,
         subject: `${APPLICATION_NAME}: ${t("Verify your email", { ctx })}`,
         html: `<h1>${t("Verify your email", { ctx })}</h1><br/>${t("Click on this link to verify your email", {
            ctx,
         })}:<br/>${getServerUrl()}/SARASAAAAA?hash=${encode(JSON.stringify({ email, password }))}<br/><br/>${t(
            "Good luck!",
            { ctx },
         )}`,
      });

      return { success: true };
   } catch (error) {
      ctx.throw(
         500,
         `${t(
            "Our email sending service is not working in this moment, please create your account using a different kind of registration",
            { ctx },
         )}. Error: ${tryToGetErrorMessage(error)}`,
      );
      return;
   }
}

/**
 * This endpoint is called by the website of the email confirmation link. If the hash contains an email and password (like
 * is supposed to), then a new user is created using that information. When the user is created a token is also created.
 * The user's token in this case is the email + password in a hash that cannot be decrypted back.
 * Notice that in all the endpoints here the passwords are not saved into the database, only the tokens that are generated
 * based on the password.
 */
export async function confirmEmailPost(
   params: ConfirmEmailParams,
   ctx: BaseContext,
): Promise<ConfirmEmailResponse> {
   const { hash } = params;
   const { email, password } = JSON.parse(decode(hash)) as EmailLoginCredentials;

   if (!email || !password) {
      ctx.throw(500, t("Invalid hash format, please register again", { ctx }));
      return;
   }

   const user = await createUser(await encrypt(email + password), email, false, ctx);

   if (user == null) {
      ctx.throw(500, "User not created. Please report error.");
      return;
   }

   return { success: true };
}

/**
 * This endpoint is called by the client app to check if the user is created and the credentials valid.
 * Since the token can be created using the email and password, the client app generates the token and sends
 * it to this endpoint to check if the user is created.
 */
export async function loginGet(params: LoginGetParams, ctx: BaseContext): Promise<LoginResponse> {
   const { token } = params;

   if (!token || token.length < 5) {
      ctx.throw(500, "Invalid hash format.");
      return;
   }

   const user = await fromQueryToUser(queryToGetUserByToken(token), false);

   if (!user) {
      ctx.throw(500, t("Invalid email or password", { ctx }));
      return;
   }

   return { success: true };
}

/**
 * This endpoint is called from the client app when the user wants to reset the password. Sends an email
 * to check for email account ownership and also a link to set the new password.
 * The link on the email contains the userId and the token encrypted, all encoded in a hash that can only
 * be decoded here. The website just sends that to the changePasswordPost() endpoint including the new
 * password the user typed.
 */
export async function resetPasswordPost(
   params: ResetPasswordPostParams,
   ctx: BaseContext,
): Promise<CreateAccountResponse> {
   const { email } = params;

   if (email?.length < 4 || !email.includes("@")) {
      ctx.throw(400, "Invalid email format");
      return;
   }

   const user = await fromQueryToUser(queryToGetUserByEmail(email), false);

   if (!user) {
      ctx.throw(400, t("We don't have a user registered with that email", { ctx }));
      return;
   }

   // TODO: Esta url es una pagina web asi que SARASAAAAA2 hay que reemplazarlo por el path
   try {
      await sendEmail({
         to: email,
         subject: `${APPLICATION_NAME}: ${t("Password reset", { ctx })}`,
         html: `<h1>${t("Password reset", { ctx })}</h1><br/>${t(
            "Click on this link to create a new password",
            {
               ctx,
            },
         )}:<br/>${getServerUrl()}/SARASAAAAA2?hash=${encode(
            JSON.stringify({
               userId: user.userId,
               tokenHashed: await encrypt(user.token),
            } as ChangePasswordCredentials),
         )}<br/><br/>${t("Good luck!", { ctx })}`,
      });

      return { success: true };
   } catch (error) {
      ctx.throw(
         500,
         `${t(
            "Our email sending service is not working in this moment, please try again in a while or report us the error",
            {
               ctx,
            },
         )}. Error: ${tryToGetErrorMessage(error)}`,
      );
      return;
   }
}

/**
 * This endpoint is called by the website where the user types the new password. If the hash contains all the credentials
 * like is supposed to, then the token of the user is changed based on the new password. Notice that in all the endpoints
 * here the passwords are not saved into the database, only the tokens that are generated based on the password.
 */
export async function changePasswordPost(
   params: ChangePasswordPostParams,
   ctx: BaseContext,
): Promise<ChangePasswordResponse> {
   const { hash, newPassword } = params;

   if (!hash || has.length < 1 || !newPassword || newPassword.length < 2) {
      ctx.throw(400, "The new password is invalid");
      return;
   }

   const { userId, tokenHashed } = JSON.parse(decode(hash)) as ChangePasswordCredentials;

   if (!userId || !tokenHashed) {
      ctx.throw(400, "Invalid hash format");
      return;
   }

   const user = await fromQueryToUser(queryToGetUserById(userId), false);

   if (!user) {
      ctx.throw(400, "The user does not exist anymore");
      return;
   }

   if (!(await compareEncryption(user.token, tokenHashed))) {
      ctx.throw(400, "Invalid token hashed");
      return;
   }

   await queryToUpdateUserToken(queryToGetUserById(userId), await encrypt(user.email + newPassword));

   return { success: true };
}
