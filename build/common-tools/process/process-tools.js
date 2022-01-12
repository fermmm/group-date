"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSystemCommand = exports.logEnvironmentMode = exports.isRunningOnAws = exports.isProductionMode = exports.executeFunctionBeforeExiting = void 0;
const shell = require("shelljs");
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
function isRunningOnAws() {
    return process.env.USING_AWS === "true" && isProductionMode();
}
exports.isRunningOnAws = isRunningOnAws;
function logEnvironmentMode() {
    if (isProductionMode()) {
        console.log("Running server in production mode.", process.env.NODE_ENV);
    }
    else {
        console.log("Running server in development mode.", process.env.NODE_ENV);
    }
}
exports.logEnvironmentMode = logEnvironmentMode;
async function executeSystemCommand(command) {
    let resolve;
    const promise = new Promise(res => {
        resolve = res;
    });
    let result = "";
    var child = shell.exec(command, { async: true });
    child.stdout.on("data", data => {
        result += data;
    });
    child.stderr.on("data", data => {
        result += data;
    });
    child.stdout.on("close", () => {
        resolve(result.trim());
    });
    return promise;
}
exports.executeSystemCommand = executeSystemCommand;
//# sourceMappingURL=process-tools.js.map