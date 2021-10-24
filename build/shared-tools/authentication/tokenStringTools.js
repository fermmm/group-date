"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenInfo = exports.createExtendedInfoToken = void 0;
/**
 * Creates a extended info token, this is a string that contains the authentication provider + token.
 * Is useful to keep provider information in the token string because can be used in different places
 * to perform specific actions depending on the authentication provider.
 *
 * For example the extended info token returned for Facebook looks like this: "Facebook[poly]abc1234".
 * The [poly] string will be used by getTokenInfo() to divide the string and parse the data.
 */
function createExtendedInfoToken(props) {
    if (props.originalToken == null) {
        return null;
    }
    return `${props.provider}[poly]${props.originalToken}`;
}
exports.createExtendedInfoToken = createExtendedInfoToken;
/**
 * Extracts information from an extended info token created with createExtendedInfoToken().
 */
function getTokenInfo(extendedInfoToken) {
    if (extendedInfoToken == null) {
        return null;
    }
    const spitted = extendedInfoToken.split("[poly]");
    if (spitted.length !== 2) {
        return null;
    }
    return {
        provider: spitted[0],
        originalToken: spitted[1],
    };
}
exports.getTokenInfo = getTokenInfo;
//# sourceMappingURL=tokenStringTools.js.map