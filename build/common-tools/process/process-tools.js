"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSystemCommand = exports.logEnvironmentMode = exports.isUsingS3 = exports.isUsingNeptune = exports.isProductionMode = exports.getNodeEnv = exports.executeFunctionBeforeExiting = void 0;
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
function getNodeEnv() {
    // The .? it seems to not work with unknown types
    if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV) {
        return process.env.NODE_ENV.toLocaleLowerCase();
    }
    return "undefined";
}
exports.getNodeEnv = getNodeEnv;
function isProductionMode() {
    if (getNodeEnv() === "production") {
        return true;
    }
    return false;
}
exports.isProductionMode = isProductionMode;
function isUsingNeptune() {
    return process.env.USING_NEPTUNE_DATABASE === "true" && isProductionMode();
}
exports.isUsingNeptune = isUsingNeptune;
function isUsingS3() {
    return process.env.USING_S3 === "true" && isProductionMode();
}
exports.isUsingS3 = isUsingS3;
function logEnvironmentMode() {
    console.log("");
    if (isProductionMode()) {
        console.log("Running server in production mode.", process.env.NODE_ENV);
    }
    else {
        console.log("Running server in development mode.", process.env.NODE_ENV);
    }
    console.log("");
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