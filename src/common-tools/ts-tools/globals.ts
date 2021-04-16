import { _consoleLog } from "../js-tools/js-tools";
import { _logTimeToFile, _logToFile } from "../log-tools/winstonLogger";

export {};

declare global {
   var consoleLog: typeof _consoleLog;
   var logToFile: typeof _logToFile;
   var logTimeToFile: typeof _logTimeToFile;
}
