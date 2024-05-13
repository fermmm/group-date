"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeCtxMuted = exports.fakeCtx = void 0;
const configurations_1 = require("../../configurations");
exports.fakeCtx = {
    header: { "accept-language": configurations_1.DEFAULT_LANGUAGE },
    throw: (code, message) => console.error(message),
};
exports.fakeCtxMuted = {
    ...exports.fakeCtx,
    throw: (code, message) => {
        /** Nothing needed here  */
    },
};
//# sourceMappingURL=replacements.js.map