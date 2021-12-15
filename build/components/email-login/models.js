"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userExistsGet = exports.createEmailLoginToken = exports.changePasswordPost = exports.resetPasswordPost = exports.loginGet = exports.confirmEmailPost = exports.createAccountPost = void 0;
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
    const { email, password, appUrl } = params;
    if ((email === null || email === void 0 ? void 0 : email.length) < 4 || !email.includes("@") || (password === null || password === void 0 ? void 0 : password.length) < 1) {
        ctx.throw(400, "Invalid credentials");
        return;
    }
    let user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), false);
    if (user) {
        ctx.throw(400, (0, i18n_tools_1.t)("An account already exists with this email", { ctx }));
        return;
    }
    const hashToSend = (0, cryptography_tools_1.encode)(JSON.stringify({ email, password }));
    const emailLink = `${(0, getServerUrl_1.getServerUrl)()}/confirm-email/?hash=${hashToSend}&appUrl=${appUrl}`;
    try {
        await (0, email_tools_1.sendEmail)({
            to: email,
            senderName: `${configurations_1.APPLICATION_NAME} app`,
            subject: `${(0, i18n_tools_1.t)("Verify your email", { ctx })}`,
            html: `<h2>${(0, i18n_tools_1.t)("Welcome to", {
                ctx,
            })} ${configurations_1.APPLICATION_NAME} =)</h2>${(0, i18n_tools_1.t)("You need to verify your email, click on this link", {
                ctx,
            })}:<br/><a ses:no-track href="${emailLink}" style="font-size: 22px;">${(0, i18n_tools_1.t)("Verify email", {
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
    const token = createEmailLoginToken({ email, password });
    user = await (0, models_1.createUser)({ token, email, includeFullInfo: false, ctx });
    if (user == null) {
        ctx.throw(500, "User not created. Please report error.");
        return;
    }
    return { success: true };
}
exports.confirmEmailPost = confirmEmailPost;
/**
 * This endpoint receives token or user and password and returns the user token if the user
 * exists. This is called by the client app in 3 situations:
 * 1. To verify that the email confirmation is completed (because the user was created)
 * 2. To verify that a token is still valid when the app boots
 * 3. In the login form to get the token
 */
async function loginGet(params, ctx) {
    let { token, email, password } = params;
    if ((!token && !email && !password) || (email && !password) || (password && !email)) {
        ctx.throw(400, (0, i18n_tools_1.t)("Invalid credentials", { ctx }));
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
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(token), false);
    if (!user) {
        if (email) {
            ctx.throw(400, (0, i18n_tools_1.t)("Invalid email or password", { ctx }));
        }
        else {
            ctx.throw(400, (0, i18n_tools_1.t)("Invalid token", { ctx }));
        }
        return;
    }
    return { userExists: true, token: user.token };
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
    const { email, appUrl } = params;
    if ((email === null || email === void 0 ? void 0 : email.length) < 4 || !email.includes("@")) {
        ctx.throw(400, "Invalid email format");
        return;
    }
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), false);
    if (!user) {
        ctx.throw(400, (0, i18n_tools_1.t)("We don't have a user registered with that email", { ctx }));
        return;
    }
    const hashToSend = (0, cryptography_tools_1.encode)(JSON.stringify({
        userId: user.userId,
        tokenHashed: (0, cryptography_tools_1.createHash)(user.token),
    }));
    const emailLink = `${(0, getServerUrl_1.getServerUrl)()}/password-reset/?hash=${hashToSend}&appUrl=${appUrl}`;
    try {
        await (0, email_tools_1.sendEmail)({
            to: email,
            senderName: `${configurations_1.APPLICATION_NAME} app`,
            subject: `${(0, i18n_tools_1.t)("Password reset", { ctx })}`,
            html: `<h2>${(0, i18n_tools_1.t)("Password reset", {
                ctx,
            })} =)</h2><br/>${(0, i18n_tools_1.t)("You requested to create a new password", {
                ctx,
            })}<br/><a ses:no-track href="${emailLink}" style="font-size: 22px;">${(0, i18n_tools_1.t)("Click on this link to create a new password", {
                ctx,
            })}</a><br/><br/>${(0, i18n_tools_1.t)("Or if you prefer copy and paste this into your browser", {
                ctx,
            })}:<br/><br/>${emailLink}
         <br/><br/>${(0, i18n_tools_1.t)("Good luck!", { ctx })}`,
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
    if (!hash || hash.length < 1 || !newPassword || newPassword.length < 2) {
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
        ctx.throw(400, "The user does not exist");
        return;
    }
    if (!(0, cryptography_tools_1.compareHash)(user.token, tokenHashed)) {
        ctx.throw(400, "Invalid token hashed");
        return;
    }
    await (0, queries_1.queryToUpdateUserToken)((0, queries_1.queryToGetUserById)(userId), createEmailLoginToken({ email: user.email, password: newPassword }));
    return { success: true };
}
exports.changePasswordPost = changePasswordPost;
function createEmailLoginToken(props) {
    const { email, password } = props;
    const hash = (0, cryptography_tools_1.createHash)(email + password);
    return (0, tokenStringTools_1.createExtendedInfoToken)({
        originalToken: hash,
        provider: AuthenticationProvider_1.AuthenticationProvider.Email,
    });
}
exports.createEmailLoginToken = createEmailLoginToken;
async function userExistsGet(props, ctx) {
    let user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(props.email), false);
    return { userExists: user != null };
}
exports.userExistsGet = userExistsGet;
//# sourceMappingURL=models.js.map