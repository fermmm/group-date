import { _consoleLog } from "../js-tools/js-tools";

export {};

// This is here to allow using the functions without an import line
globalThis.consoleLog = _consoleLog;

declare global {
   var consoleLog: typeof _consoleLog;
}
