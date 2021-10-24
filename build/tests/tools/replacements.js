"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeCtxMuted = exports.fakeCtx = void 0;
exports.fakeCtx = {
    throw: (code, message) => console.error(message),
};
exports.fakeCtxMuted = {
    throw: (code, message) => {
        /** Nothing needed here  */
    },
};
//# sourceMappingURL=replacements.js.map