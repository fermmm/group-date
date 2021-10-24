"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminCredentials = void 0;
const process_tools_1 = require("../../../common-tools/process/process-tools");
function validateAdminCredentials(params) {
    var _a, _b;
    const { user, password, onlyInProduction } = params;
    if (onlyInProduction === true && !(0, process_tools_1.isProductionMode)()) {
        return { isValid: true };
    }
    if (((_a = process.env.ADMIN_USER) !== null && _a !== void 0 ? _a : "") === "") {
        return {
            isValid: false,
            error: "Error: Set the ADMIN_USER in the .env file and deploy. There is no ADMIN_USER set.",
        };
    }
    if (((_b = process.env.ADMIN_PASSWORD) !== null && _b !== void 0 ? _b : "") === "") {
        return {
            isValid: false,
            error: "Error: Set the ADMIN_PASSWORD in the .env file and deploy. There is no ADMIN_PASSWORD set.",
        };
    }
    if (process.env.ADMIN_USER.length < 2) {
        return {
            isValid: false,
            error: "ADMIN_USER in .env is invalid, needs to be 2 characters long or more",
        };
    }
    if (process.env.ADMIN_PASSWORD.length < 6) {
        return {
            isValid: false,
            error: "ADMIN_PASSWORD in .env is invalid, needs to be 6 characters long or more",
        };
    }
    if (process.env.ADMIN_USER !== user || process.env.ADMIN_PASSWORD !== password) {
        return {
            isValid: false,
            error: "Invalid user or password format",
        };
    }
    return { isValid: true };
}
exports.validateAdminCredentials = validateAdminCredentials;
//# sourceMappingURL=validateAdminCredentials.js.map