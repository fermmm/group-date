"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._logTimeToFile = exports._logToFile = void 0;
const configurations_1 = require("../../configurations");
const winstonCreateLogger_1 = require("./winstonCreateLogger");
/**
 * Like a console.log() that saves the log to files using winston.js library.
 */
function _logToFile(message, file, logChannel = winstonCreateLogger_1.LogChannels.Info) {
    if (process.env.GENERATE_LOGS !== "true") {
        return;
    }
    configurations_1.LOG_FILES[file].log(logChannel, message);
}
exports._logToFile = _logToFile;
/**
 * This returns a profiler variable where you have to call done() to log the time:
 * const profiler = logTimeToFileFn("file");
 * ...
 * profiler.done({ message: 'Task was done in' });
 */
function _logTimeToFile(file) {
    if (process.env.GENERATE_LOGS !== "true") {
        return {
            done: (info) => true,
        };
    }
    return configurations_1.LOG_FILES[file].startTimer();
}
exports._logTimeToFile = _logTimeToFile;
//# sourceMappingURL=winstonLogger.js.map