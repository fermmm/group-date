"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTokenFromEmailPass = exports.changePasswordPost = exports.resetPasswordPost = exports.loginGet = exports.tokenGet = exports.confirmEmailPost = exports.createAccountPost = void 0;
const util_1 = require("typescript-collections/dist/lib/util");
const cryptography_tools_1 = require("../../common-tools/cryptography-tools/cryptography-tools");
const email_tools_1 = require("../../common-tools/email-tools/email-tools");
const tryToGetErrorMessage_1 = require("../../common-tools/httpRequest/tools/tryToGetErrorMessage");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const getServerUrl_1 = require("../../common-tools/url-tools/getServerUrl");
const configurations_1 = require("../../configurations");
const AuthenticationProvider_1 = require("../../shared-tools/authentication/AuthenticationProvider");
const tokenStringTools_1 = require("../../shared-tools/authentication/tokenStringTools");
const models_1 = require("../user/models");
const queries_1 = require("../user/queries");
const data_conversion_1 = require("../user/tools/data-conversion");
/**
 * This endpoint is executed by the client app when the user wants to create an account, after typing the email and password.
 * Sends an email to verify ownership of the email account. The email contains a link to a website with the email and password
 * encoded in the url. The website sends the hash back to the confirmEmailPost() endpoint to create the user.
 */
async function createAccountPost(params, ctx) {
    const { email, password } = params;
    if ((email === null || email === void 0 ? void 0 : email.length) < 4 || !email.includes("@") || (password === null || password === void 0 ? void 0 : password.length) < 1) {
        ctx.throw(400, "Invalid credentials");
        return;
    }
    const hashToSend = (0, cryptography_tools_1.encode)(JSON.stringify({ email, password }));
    const emailLink = `${(0, getServerUrl_1.getServerUrl)()}/confirm-email/?hash=${hashToSend}`;
    try {
        await (0, email_tools_1.sendEmail)({
            to: email,
            senderName: `${configurations_1.APPLICATION_NAME} app`,
            subject: `${(0, i18n_tools_1.t)("Verify your email", { ctx })}`,
            html: `<h2>${(0, i18n_tools_1.t)("Welcome to", {
                ctx,
            })} ${configurations_1.APPLICATION_NAME} =)</h2>${(0, i18n_tools_1.t)("You need to verify your email, click on this link", {
                ctx,
            })}:<br/><a href="${emailLink}" style="font-size: 22px;">${(0, i18n_tools_1.t)("Verify email", {
                ctx,
            })}</a><br/><br/>${(0, i18n_tools_1.t)("Or if you prefer copy and paste this into your browser", {
                ctx,
            })}:<br/><br/>${emailLink}
         <br/><br/>${(0, i18n_tools_1.t)("Good luck!", { ctx })}`,
        });
        return { success: true };
    }
    catch (error) {
        ctx.throw(500, `${(0, i18n_tools_1.t)("Our email sending service is not working in this moment, please create your account using a different kind of registration", { ctx })}. Error: ${(0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error)}`);
        return;
    }
}
exports.createAccountPost = createAccountPost;
/**
 * This endpoint is called by the website of the email confirmation link. If the hash contains an email and password (like
 * is supposed to), then a new user is created using that information. When the user is created a token is also created.
 * The user's token in this case is the email + password in a hash that cannot be decrypted back.
 * Notice that in all the endpoints here the passwords are not saved into the database, only the tokens that are generated
 * based on the password.
 */
async function confirmEmailPost(params, ctx) {
    const { hash } = params;
    const { email, password } = JSON.parse((0, cryptography_tools_1.decode)(hash));
    if (!email || !password) {
        ctx.throw(500, (0, i18n_tools_1.t)("Invalid hash format, please register again", { ctx }));
        return;
    }
    let user = (await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), false));
    if (user) {
        return { success: true };
    }
    const originalToken = await createTokenFromEmailPass({ email, password });
    const extendedInfoToken = (0, tokenStringTools_1.createExtendedInfoToken)({ originalToken, provider: AuthenticationProvider_1.AuthenticationProvider.Email });
    user = await (0, models_1.createUser)(extendedInfoToken, email, false, ctx);
    if (user == null) {
        ctx.throw(500, "User not created. Please report error.");
        return;
    }
    return { success: true };
}
exports.confirmEmailPost = confirmEmailPost;
/**
 * This endpoint is called by the client app to get the token when it has the user and password. In
 * other words this endpoint returns the token when a email and password is provided. The token is
 * always returned wether the user exists or not. To check the token is valid the login GET endpoint
 * needs to be called.
 */
async function tokenGet(params, ctx) {
    const { email, password } = params;
    if (!email || typeof email !== "string" || email.length < 1) {
        ctx.throw(500, "Invalid email.");
        return;
    }
    if (!password || typeof password !== "string" || password.length < 1) {
        ctx.throw(500, "Invalid password.");
        return;
    }
    const token = await createTokenFromEmailPass({ email, password });
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(token), false);
    if (!user) {
        ctx.throw(500, (0, i18n_tools_1.t)("Invalid email or password", { ctx }));
        return;
    }
    return { token };
}
exports.tokenGet = tokenGet;
/**
 * This endpoint is called by the client app to check if the user is created and the credentials valid.
 * Since the token can be created using the email and password, the client app generates the token and sends
 * it to this endpoint to check if the user is created.
 */
async function loginGet(params, ctx) {
    const { token } = params;
    if (!token || token.length < 5) {
        ctx.throw(500, "Invalid hash format.");
        return;
    }
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(token), false);
    if (!user) {
        ctx.throw(500, (0, i18n_tools_1.t)("Invalid email or password", { ctx }));
        return;
    }
    return { success: true };
}
exports.loginGet = loginGet;
/**
 * This endpoint is called from the client app when the user wants to reset the password. Sends an email
 * to check for email account ownership and also a link to set the new password.
 * The link on the email contains the userId and the token encrypted, all encoded in a hash that can only
 * be decoded here. The website just sends that to the changePasswordPost() endpoint including the new
 * password the user typed.
 */
async function resetPasswordPost(params, ctx) {
    const { email } = params;
    if ((email === null || email === void 0 ? void 0 : email.length) < 4 || !email.includes("@")) {
        ctx.throw(400, "Invalid email format");
        return;
    }
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), false);
    if (!user) {
        ctx.throw(400, (0, i18n_tools_1.t)("We don't have a user registered with that email", { ctx }));
        return;
    }
    // TODO: Esta url es una pagina web asi que SARASAAAAA2 hay que reemplazarlo por el path
    try {
        await (0, email_tools_1.sendEmail)({
            to: email,
            senderName: `${configurations_1.APPLICATION_NAME} app`,
            subject: `${(0, i18n_tools_1.t)("Password reset", { ctx })}`,
            html: `<h1>${(0, i18n_tools_1.t)("Password reset", { ctx })}</h1><br/>${(0, i18n_tools_1.t)("Click on this link to create a new password", {
                ctx,
            })}:<br/>${(0, getServerUrl_1.getServerUrl)()}/SARASAAAAA2?hash=${(0, cryptography_tools_1.encode)(JSON.stringify({
                userId: user.userId,
                tokenHashed: await (0, cryptography_tools_1.encrypt)(user.token),
            }))}<br/><br/>${(0, i18n_tools_1.t)("Good luck!", { ctx })}`,
        });
        return { success: true };
    }
    catch (error) {
        ctx.throw(500, `${(0, i18n_tools_1.t)("Our email sending service is not working in this moment, please try again in a while or report us the error", {
            ctx,
        })}. Error: ${(0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error)}`);
        return;
    }
}
exports.resetPasswordPost = resetPasswordPost;
/**
 * This endpoint is called by the website where the user types the new password. If the hash contains all the credentials
 * like is supposed to, then the token of the user is changed based on the new password. Notice that in all the endpoints
 * here the passwords are not saved into the database, only the tokens that are generated based on the password.
 */
async function changePasswordPost(params, ctx) {
    const { hash, newPassword } = params;
    if (!hash || util_1.has.length < 1 || !newPassword || newPassword.length < 2) {
        ctx.throw(400, "The new password is invalid");
        return;
    }
    const { userId, tokenHashed } = JSON.parse((0, cryptography_tools_1.decode)(hash));
    if (!userId || !tokenHashed) {
        ctx.throw(400, "Invalid hash format");
        return;
    }
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserById)(userId), false);
    if (!user) {
        ctx.throw(400, "The user does not exist anymore");
        return;
    }
    if (!(await (0, cryptography_tools_1.compareEncryption)(user.token, tokenHashed))) {
        ctx.throw(400, "Invalid token hashed");
        return;
    }
    await (0, queries_1.queryToUpdateUserToken)((0, queries_1.queryToGetUserById)(userId), await (0, cryptography_tools_1.encrypt)(user.email + newPassword));
    return { success: true };
}
exports.changePasswordPost = changePasswordPost;
async function createTokenFromEmailPass(props) {
    const { email, password } = props;
    return await (0, cryptography_tools_1.encrypt)(email + password);
}
exports.createTokenFromEmailPass = createTokenFromEmailPass;
//# sourceMappingURL=models.js.map