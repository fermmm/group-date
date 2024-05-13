"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromDiskToMemoryLogs = exports.fromMemoryLogsToDisk = void 0;
const files_tools_1 = require("../../files-tools/files-tools");
const config_1 = require("../config");
const log_storage_memory_1 = require("./log-storage-memory");
function fromMemoryLogsToDisk() {
    const logsInMemory = (0, log_storage_memory_1.getAllInMemoryLogs)();
    (0, log_storage_memory_1.getLogsPendingToSave)().forEach(logId => {
        (0, files_tools_1.writeFile)(`${config_1.LOGS_DIR_NAME}/${logId}.log`, logsInMemory[logId]);
    });
    (0, log_storage_memory_1.clearLogsPendingToSave)();
}
exports.fromMemoryLogsToDisk = fromMemoryLogsToDisk;
function fromDiskToMemoryLogs() {
    (0, files_tools_1.readFolder)(config_1.LOGS_DIR_NAME).forEach(fileName => {
        const fileNameWithoutExtension = fileName.split(".")[0];
        (0, log_storage_memory_1.setInMemoryLog)(fileNameWithoutExtension, (0, files_tools_1.getFileContent)(`${config_1.LOGS_DIR_NAME}/${fileName}`));
    });
}
exports.fromDiskToMemoryLogs = fromDiskToMemoryLogs;
//# sourceMappingURL=log-storage-disk.js.map