"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryToGetErrorMessage = void 0;
function tryToGetErrorMessage(error) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (error === undefined) {
        return "";
    }
    if ((_c = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) {
        return error.response.data.error.message;
    }
    if (((_f = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) !== undefined) {
        return error.response.data[0].message;
    }
    if (((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) !== undefined) {
        return error.response.data;
    }
    if (error.response !== undefined) {
        return error.response;
    }
    if (error.message !== undefined) {
        return `Error: ${error.message}`;
    }
    if (error.msg !== undefined) {
        return `Error: ${error.msg}`;
    }
    let errorAsJson = null;
    try {
        errorAsJson = JSON.stringify(error);
    }
    catch { }
    if (errorAsJson !== undefined) {
        return `Error: ${errorAsJson}`;
    }
    return `Unknown error`;
}
exports.tryToGetErrorMessage = tryToGetErrorMessage;
//# sourceMappingURL=tryToGetErrorMessage.js.map