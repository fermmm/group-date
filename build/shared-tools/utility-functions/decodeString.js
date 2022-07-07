"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeString = void 0;
/**
 * Decodes a string using encodeString(), currently just calls decodeURI().
 */
function decodeString(str) {
    try {
        return decodeURI(str);
    }
    catch (e) {
        console.log("Warning: decodeUri() failed to decode te following string:", str);
        return str;
    }
}
exports.decodeString = decodeString;
//# sourceMappingURL=decodeString.js.map