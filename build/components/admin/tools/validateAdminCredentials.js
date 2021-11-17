"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialsHash = exports.validateAdminCredentials = void 0;
const cryptography_tools_1 = require("../../../common-tools/cryptography-tools/cryptography-tools");
const process_tools_1 = require("../../../common-tools/process/process-tools");
async function validateAdminCredentials(params) {
    var _a, _b;
    const { user, password, hash, onlyInProduction } = params;
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
    if (hash != null) {
        try {
            const valid = await (0, cryptography_tools_1.compareHash)(process.env.ADMIN_USER + process.env.ADMIN_PASSWORD, hash);
            if (valid === true) {
                return { isValid: true };
            }
        }
        catch (err) {
            return {
                isValid: false,
                error: "Invalid user or password format",
            };
        }
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
function getCredentialsHash() {
    return (0, cryptography_tools_1.createHash)(process.env.ADMIN_USER + process.env.ADMIN_PASSWORD);
}
exports.getCredentialsHash = getCredentialsHash;
//# sourceMappingURL=validateAdminCredentials.js.map