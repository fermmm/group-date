"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeString = void 0;
/**
 * Encodes a string using encodeURIComponent() to avoid issues with string characters.
 */
function encodeString(str) {
    if (str == null) {
        return str;
    }
    return encodeURIComponent(str);
}
exports.encodeString = encodeString;
//# sourceMappingURL=encodeString.js.map