"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSystemCommand = exports.logEnvironmentMode = exports.isProductionMode = exports.executeFunctionBeforeExiting = void 0;
const util_1 = require("util");
const child_process = require("child_process");
const tryToGetErrorMessage_1 = require("../httpRequest/tools/tryToGetErrorMessage");
const exec = (0, util_1.promisify)(child_process.exec);
const exitSignals = [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`];
let initialized = false;
const functionsToExecute = [];
function executeFunctionBeforeExiting(fn) {
    functionsToExecute.push(fn);
    if (initialized) {
        return;
    }
    exitSignals.forEach(eventType => {
        process.on(eventType, async () => {
            process.stdin.resume();
            for (const fn of functionsToExecute) {
                await fn();
            }
            process.exit();
        });
    });
    initialized = true;
}
exports.executeFunctionBeforeExiting = executeFunctionBeforeExiting;
function isProductionMode() {
    // The .? it seems to not work with unknown types
    if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "production") {
        return true;
    }
    return false;
}
exports.isProductionMode = isProductionMode;
function logEnvironmentMode() {
    if (isProductionMode()) {
        console.log("Running server in production mode.");
    }
    else {
        console.log("Running server in development mode.");
    }
}
exports.logEnvironmentMode = logEnvironmentMode;
async function executeSystemCommand(command, options = {}) {
    var _a, _b;
    let response;
    try {
        const { stdout, stderr } = await exec(command, options);
        response = stdout.length > 0 ? stdout : stderr;
        response = response.trim();
    }
    catch (error) {
        if (((_a = error === null || error === void 0 ? void 0 : error.stderr) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            response = error.stderr.trim();
            return;
        }
        if (((_b = error === null || error === void 0 ? void 0 : error.stdout) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            response = error.stdout.trim();
            return;
        }
        response = (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error);
    }
    return response;
}
exports.executeSystemCommand = executeSystemCommand;
//# sourceMappingURL=process-tools.js.map