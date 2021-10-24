"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserEmailFromAuthProvider = void 0;
const getEmailFromGoogle_1 = require("./google/getEmailFromGoogle");
const tokenStringTools_1 = require("../../../../shared-tools/authentication/tokenStringTools");
const getEmailFromFacebook_1 = require("./facebook/getEmailFromFacebook");
const AuthenticationProvider_1 = require("../../../../shared-tools/authentication/AuthenticationProvider");
async function getUserEmailFromAuthProvider(token, ctx) {
    const tokenInfo = (0, tokenStringTools_1.getTokenInfo)(token);
    switch (tokenInfo.provider) {
        case AuthenticationProvider_1.AuthenticationProvider.Facebook:
            return await (0, getEmailFromFacebook_1.getEmailFromFacebook)(tokenInfo.originalToken, ctx);
        case AuthenticationProvider_1.AuthenticationProvider.Google:
            return await (0, getEmailFromGoogle_1.getEmailFromGoogle)(tokenInfo.originalToken, ctx);
    }
}
exports.getUserEmailFromAuthProvider = getUserEmailFromAuthProvider;
//# sourceMappingURL=getUserEmailFromAuthProvider.js.map