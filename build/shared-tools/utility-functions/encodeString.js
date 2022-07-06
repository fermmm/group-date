"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeString = void 0;
/**
 * Encodes a string using encodeURI() to avoid issues with string characters.
 */
function encodeString(str) {
    return encodeURI(str);
}
exports.encodeString = encodeString;
//# sourceMappingURL=encodeString.js.map