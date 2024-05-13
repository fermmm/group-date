"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryToStringifyObject = void 0;
function tryToStringifyObject(obj) {
    if (obj === undefined) {
        return "undefined";
    }
    if (obj === null) {
        return "null";
    }
    try {
        return JSON.stringify(obj);
    }
    catch (e) { }
    try {
        return obj.toString();
    }
    catch (e) { }
    return "tryToStringifyObject() not implemented: " + typeof obj;
}
exports.tryToStringifyObject = tryToStringifyObject;
//# sourceMappingURL=tryToStringifyObject.js.map