"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEnvironmentMode = exports.isProductionMode = exports.executeFunctionBeforeExiting = void 0;
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
//# sourceMappingURL=process-tools.js.map