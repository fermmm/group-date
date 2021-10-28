"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptCredentials = exports.validateAdminCredentials = void 0;
const bcrypt = require("bcrypt");
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
            const valid = await encryptedCredentialsAreValid(hash);
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
async function encryptCredentials(props) {
    const { user, password } = props;
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            reject(err);
            return;
        }
        bcrypt.hash(user + password, salt, (err2, hash) => {
            if (err2) {
                reject(err2);
                return;
            }
            resolve(hash);
        });
    });
    return promise;
}
exports.encryptCredentials = encryptCredentials;
async function encryptedCredentialsAreValid(hash) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    bcrypt.compare(process.env.ADMIN_USER + process.env.ADMIN_PASSWORD, hash, (err, isPasswordMatch) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(isPasswordMatch);
    });
    return promise;
}
//# sourceMappingURL=validateAdminCredentials.js.map