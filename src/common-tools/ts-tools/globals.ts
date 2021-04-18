import { _consoleLog } from "../js-tools/js-tools";
import { _logTimeToFile, _logToFile } from "../log-tools/winstonLogger";

export {};

// This is here to allow using the functions without an import line
globalThis.logToFile = _logToFile;
globalThis.logTimeToFile = _logTimeToFile;
globalThis.consoleLog = _consoleLog;

declare global {
   var consoleLog: typeof _consoleLog;
   var logToFile: typeof _logToFile;
   var logTimeToFile: typeof _logTimeToFile;
}
