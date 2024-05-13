"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeString = void 0;
/**
 * Decodes a string that was encoded using encodeString(), currently just calls decodeURIComponent().
 */
function decodeString(str) {
    try {
        return decodeURIComponent(str);
    }
    catch (e) {
        console.log("Warning: decodeURIComponent() failed to decode te following string:", str);
        return str;
    }
}
exports.decodeString = decodeString;
//# sourceMappingURL=decodeString.js.map