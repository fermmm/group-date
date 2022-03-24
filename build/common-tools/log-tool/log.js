"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const moment = require("moment");
const config_1 = require("./config");
// TODO: logsInMemory tiene que tener el contenido de los logs en disco o S3
const logSeparatorString = "[__log_sep____]";
let logsInMemory = {};
const logsPendingToSave = new Set();
function log(props) {
    var _a;
    const { logId, logContent } = props;
    const config = config_1.logsConfig === null || config_1.logsConfig === void 0 ? void 0 : config_1.logsConfig.find(c => c.id === logId);
    if (config == null) {
        throw new Error(`LogId ${logId} not found`);
        return;
    }
    try {
        let currentLogInMem = (_a = logsInMemory[logId]) !== null && _a !== void 0 ? _a : "";
        if (config.maxEntries != null || config.maxEntryAge != null) {
            let logsAsArr = currentLogInMem.split(logSeparatorString);
            // If the log config requires to remove exceeding entries we do it here
            if (config.maxEntries != null) {
                if (logsAsArr.length > config.maxEntries) {
                    logsAsArr = logsAsArr.slice(logsAsArr.length - config.maxEntries);
                }
            }
            // If the log config requires to remove dated entries wo do it here
            if (config.maxEntryAge != null) {
                logsAsArr = logsAsArr.filter(log => JSON.parse(log).timestamp > moment().unix() - config.maxEntryAge);
            }
            currentLogInMem = logsAsArr.join(logSeparatorString);
        }
        if (currentLogInMem.length > 0) {
            currentLogInMem += logSeparatorString;
        }
        currentLogInMem += JSON.stringify({ timestamp: moment().unix(), ...logContent });
        logsInMemory[logId] = currentLogInMem;
        logsPendingToSave.add(logId);
    }
    catch (error) {
        console.error(error);
    }
}
exports.log = log;
//# sourceMappingURL=log.js.map