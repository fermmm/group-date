"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupLogs = exports.restoreLogs = void 0;
const process_tools_1 = require("../../process/process-tools");
const log_storage_disk_1 = require("./log-storage-disk");
const log_storage_s3_1 = require("./log-storage-s3");
async function restoreLogs() {
    if ((0, process_tools_1.isRunningOnAws)()) {
        await (0, log_storage_s3_1.fromS3ToDisk)();
    }
    (0, log_storage_disk_1.fromDiskToMemoryLogs)();
}
exports.restoreLogs = restoreLogs;
async function backupLogs(specificLogs) {
    (0, log_storage_disk_1.fromMemoryLogsToDisk)();
    if ((0, process_tools_1.isRunningOnAws)()) {
        await (0, log_storage_s3_1.fromDiskToS3)(specificLogs);
    }
}
exports.backupLogs = backupLogs;
//# sourceMappingURL=log-storage.js.map