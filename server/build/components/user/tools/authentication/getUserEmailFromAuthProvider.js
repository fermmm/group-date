"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserEmailFromToken = void 0;
const getEmailFromGoogle_1 = require("./google/getEmailFromGoogle");
const tokenStringTools_1 = require("../../../../shared-tools/authentication/tokenStringTools");
const getEmailFromFacebook_1 = require("./facebook/getEmailFromFacebook");
const AuthenticationProvider_1 = require("../../../../shared-tools/authentication/AuthenticationProvider");
async function getUserEmailFromToken(token, ctx) {
    const tokenInfo = (0, tokenStringTools_1.getTokenInfo)(token);
    switch (tokenInfo.provider) {
        case AuthenticationProvider_1.AuthenticationProvider.Facebook:
            return await (0, getEmailFromFacebook_1.getEmailFromFacebook)(tokenInfo.originalToken, ctx);
        case AuthenticationProvider_1.AuthenticationProvider.Google:
            return await (0, getEmailFromGoogle_1.getEmailFromGoogle)(tokenInfo.originalToken, ctx);
        case AuthenticationProvider_1.AuthenticationProvider.Email:
            ctx.throw(401, "Invalid token, please login again");
    }
}
exports.getUserEmailFromToken = getUserEmailFromToken;
//# sourceMappingURL=getUserEmailFromAuthProvider.js.map