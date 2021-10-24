"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_tools_1 = require("../js-tools/js-tools");
const winstonLogger_1 = require("../log-tools/winstonLogger");
// This is here to allow using the functions without an import line
globalThis.logToFile = winstonLogger_1._logToFile;
globalThis.logTimeToFile = winstonLogger_1._logTimeToFile;
globalThis.consoleLog = js_tools_1._consoleLog;
//# sourceMappingURL=globals.js.map