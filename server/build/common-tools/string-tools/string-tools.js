"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strToBool = exports.toFirstUpperCase = exports.generateId = exports.versionIsCompatible = void 0;
const nanoid_1 = require("nanoid");
const semver = require("semver");
function versionIsCompatible(current, required) {
    return semver.gte(current, required);
}
exports.versionIsCompatible = versionIsCompatible;
/**
 * Generate secure URL-friendly unique ID.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 *
 * @param size Size of the ID. The default size is 21.
 * @returns A random string
 */
function generateId(size = 21) {
    return (0, nanoid_1.nanoid)(size);
}
exports.generateId = generateId;
/**
 * Converts the first character of a string to upper case
 */
function toFirstUpperCase(str) {
    if (str == null) {
        return str;
    }
    if (str.length < 1) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.toFirstUpperCase = toFirstUpperCase;
function strToBool(str) {
    return (str === null || str === void 0 ? void 0 : str.toLowerCase().split(" ").join("")) === "true";
}
exports.strToBool = strToBool;
//# sourceMappingURL=string-tools.js.map