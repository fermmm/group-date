"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const moment = require("moment");
const string_tools_1 = require("../string-tools/string-tools");
const config_1 = require("./config");
const log_storage_1 = require("./storage/log-storage");
const log_storage_memory_1 = require("./storage/log-storage-memory");
function log(content, logId) {
    const config = config_1.logsConfig === null || config_1.logsConfig === void 0 ? void 0 : config_1.logsConfig.find(c => c.id === logId);
    if (config == null) {
        throw new Error(`LogId ${logId} not found`);
        return;
    }
    try {
        let currentLogInMem = (0, log_storage_memory_1.getInMemoryLog)(logId);
        if (config.maxEntries != null || config.maxEntryAge != null) {
            let logsAsArr = currentLogInMem.split(config_1.ENTRY_SEPARATOR_STRING);
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
            currentLogInMem = logsAsArr.join(config_1.ENTRY_SEPARATOR_STRING);
        }
        if (currentLogInMem.length > 0) {
            currentLogInMem += config_1.ENTRY_SEPARATOR_STRING;
        }
        const entryId = (0, string_tools_1.generateId)(6);
        const timestamp = moment().unix();
        currentLogInMem += JSON.stringify({ timestamp, entryId, content });
        (0, log_storage_memory_1.setInMemoryLog)(logId, currentLogInMem);
        if (config.backupAfterEntryAdded) {
            (0, log_storage_1.backupLogs)([logId]);
        }
    }
    catch (error) {
        console.error(error);
    }
}
exports.log = log;
//# sourceMappingURL=log.js.map