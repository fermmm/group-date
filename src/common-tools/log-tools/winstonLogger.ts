import { LOG_FILES } from "../../configurations";
import { LogChannels } from "./winstonCreateLogger";

/**
 * Like a console.log() that saves the log to files using winston.js library.
 */
export function _logToFile(
   message: string,
   file: keyof typeof LOG_FILES,
   logChannel: LogChannels = LogChannels.Info,
) {
   LOG_FILES[file].log(logChannel, message);
}

/**
 * This returns a profiler variable where you have to call done() to log the time:
 * const profiler = logTimeToFileFn("file");
 * ...
 * profiler.done({ message: 'Task was done in' });
 */
export function _logTimeToFile(file: keyof typeof LOG_FILES) {
   return LOG_FILES[file].startTimer();
}

// This is here to allow using the functions without an import line
globalThis.logToFile = _logToFile;
globalThis.logTimeToFile = _logTimeToFile;
