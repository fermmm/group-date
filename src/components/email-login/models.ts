import { BaseContext } from "koa";
import {
   compareHash,
   decode,
   encode,
   createHash,
} from "../../common-tools/cryptography-tools/cryptography-tools";
import { EmailSendProps, sendEmail } from "../../common-tools/email-tools/email-tools";
import { loadHtmlEmailTemplate } from "../../common-tools/email-tools/loadHtmlTemplate";
import { tryToGetErrorMessage } from "../../common-tools/httpRequest/tools/tryToGetErrorMessage";
import { t } from "../../common-tools/i18n-tools/i18n-tools";
import { getServerUrl } from "../../common-tools/url-tools/getServerUrl";
import { APPLICATION_NAME } from "../../configurations";
import { AuthenticationProvider } from "../../shared-tools/authentication/AuthenticationProvider";
import { createExtendedInfoToken } from "../../shared-tools/authentication/tokenStringTools";
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
   ResetPasswordResponse,
   UserExistsGetParams,
   UserExistsResponse,
} from "../../shared-tools/endpoints-interfaces/email-login";
import { User } from "../../shared-tools/endpoints-interfaces/user";
import { createUser } from "../user/models";
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
   const { email, password, appUrl, logLinkOnConsole } = params;

   if (email?.length < 4 || !email.includes("@") || password?.length < 1) {
      ctx.throw(400, "Invalid credentials");
      return;
   }

   let user = await fromQueryToUser(queryToGetUserByEmail(email), false);

   if (user) {
      ctx.throw(400, t("An account already exists with this email", { ctx }));
      return;
   }

   const hashToSend = encode(JSON.stringify({ email, password }));
   const emailLink = `${getServerUrl()}/confirm-email/?hash=${hashToSend}&appUrl=${appUrl}`;
   if (logLinkOnConsole) {
      console.log(emailLink);
   }

   try {
      const emailInfo: EmailSendProps = {
         to: email,
         senderName: `${APPLICATION_NAME} app`,
         subject: `${t("Verify your email", { ctx })}`,
         html: loadHtmlEmailTemplate({
            variablesToReplace: {
               title: `${t("Welcome to", { ctx })} ${APPLICATION_NAME}`,
               content: `${t("You need to verify your email, click on this link", {
                  ctx,
               })}:<br/><a ses:no-track href="${emailLink}" style="font-size: 22px;">${t("Verify email", {
                  ctx,
               })}</a><br/><br/>${t("Or if you prefer copy and paste this into your browser", {
                  ctx,
               })}:<br/><br/>${emailLink}
               <br/><br/>${t("Good luck!", { ctx })}`,
            },
            translationSources: { ctx },
         }),
      };

      await sendEmail(emailInfo);

      return { success: true };
   } catch (error) {
      ctx.throw(
         400,
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

   let user = (await fromQueryToUser(queryToGetUserByEmail(email), false)) as Partial<User>;

   if (user) {
      return { success: true };
   }

   const token = createEmailLoginToken({ email, password });

   user = await createUser({ token, email, includeFullInfo: false, ctx });

   if (user == null) {
      ctx.throw(500, "User not created. Please report error.");
      return;
   }

   return { success: true };
}

/**
 * This endpoint receives token or user and password and returns the user token if the user
 * exists. This is called by the client app in 3 situations:
 * 1. To verify that the email confirmation is completed (because the user was created)
 * 2. To verify that a token is still valid when the app boots
 * 3. In the login form to get the token
 */
export async function loginGet(params: LoginGetParams, ctx: BaseContext): Promise<LoginResponse> {
   let { token, email, password } = params;

   if ((!token && !email && !password) || (email && !password) || (password && !email)) {
      ctx.throw(400, t("Invalid credentials", { ctx }));
      return;
   }

   if (email && (typeof email !== "string" || email.length < 1)) {
      ctx.throw(400, "Invalid email.");
      return;
   }

   if (password && (typeof password !== "string" || password.length < 1)) {
      ctx.throw(400, "Invalid password.");
      return;
   }

   if (token && token.length < 5) {
      ctx.throw(400, "Invalid hash format.");
      return;
   }

   if (token == null) {
      token = createEmailLoginToken({ email, password });
   }

   const user = await fromQueryToUser(queryToGetUserByToken(token), false);

   if (!user) {
      if (email) {
         ctx.throw(400, t("Invalid email or password", { ctx }));
      } else {
         ctx.throw(400, t("Invalid token", { ctx }));
      }
      return;
   }

   return { userExists: true, token: user.token };
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
): Promise<ResetPasswordResponse> {
   const { email, appUrl } = params;

   if (email?.length < 4 || !email.includes("@")) {
      ctx.throw(400, "Invalid email format");
      return;
   }

   const user = await fromQueryToUser(queryToGetUserByEmail(email), false);

   if (!user) {
      ctx.throw(400, t("We don't have a user registered with that email", { ctx }));
      return;
   }

   const hashToSend = encode(
      JSON.stringify({
         userId: user.userId,
         tokenHashed: createHash(user.token),
      } as ChangePasswordCredentials),
   );
   const emailLink = `${getServerUrl()}/password-reset/?hash=${hashToSend}&appUrl=${appUrl}`;

   try {
      await sendEmail({
         to: email,
         senderName: `${APPLICATION_NAME} app`,
         subject: `${t("Password reset", { ctx })}`,
         html: loadHtmlEmailTemplate({
            variablesToReplace: {
               title: `${t("Password reset", { ctx })}`,
               content: `<br/>${t("You requested to create a new password", {
                  ctx,
               })}<br/><a ses:no-track href="${emailLink}" style="font-size: 22px;">${t(
                  "Click on this link to create a new password",
                  {
                     ctx,
                  },
               )}</a><br/><br/>${t("Or if you prefer copy and paste this into your browser", {
                  ctx,
               })}:<br/><br/>${emailLink}
               <br/><br/>${t("Good luck!", { ctx })}`,
            },
            translationSources: { ctx },
         }),
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

   if (!hash || hash.length < 1 || !newPassword || newPassword.length < 2) {
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
      ctx.throw(400, "The user does not exist");
      return;
   }

   if (!compareHash(user.token, tokenHashed)) {
      ctx.throw(400, "Invalid token hashed");
      return;
   }

   await queryToUpdateUserToken(
      queryToGetUserById(userId),
      createEmailLoginToken({ email: user.email, password: newPassword }),
   );

   return { success: true };
}

export function createEmailLoginToken(props: EmailLoginCredentials) {
   const { email, password } = props;
   const hash = createHash(email + password);
   return createExtendedInfoToken({
      originalToken: hash,
      provider: AuthenticationProvider.Email,
   });
}

export async function userExistsGet(props: UserExistsGetParams, ctx: BaseContext): Promise<UserExistsResponse> {
   let user = await fromQueryToUser(queryToGetUserByEmail(props.email), false);
   return { userExists: user != null };
}
