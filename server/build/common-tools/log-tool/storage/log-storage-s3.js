"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromS3ToDisk = exports.fromDiskToS3 = void 0;
const s3_tools_1 = require("../../aws/s3-tools");
const files_tools_1 = require("../../files-tools/files-tools");
const tryToGetErrorMessage_1 = require("../../httpRequest/tools/tryToGetErrorMessage");
const config_1 = require("../config");
async function fromDiskToS3(specificLogs) {
    const fileNames = (0, files_tools_1.readFolder)(config_1.LOGS_DIR_NAME);
    for (const fileName of fileNames) {
        if ((specificLogs === null || specificLogs === void 0 ? void 0 : specificLogs.length) > 0) {
            const fileNameWithoutExtension = fileName.split(".")[0];
            if (!specificLogs.includes(fileNameWithoutExtension)) {
                continue;
            }
        }
        const filePath = `${config_1.LOGS_DIR_NAME}/${fileName}`;
        await (0, s3_tools_1.uploadFileToS3)({ localFilePath: filePath, s3TargetPath: filePath });
    }
}
exports.fromDiskToS3 = fromDiskToS3;
async function fromS3ToDisk() {
    for (const logConfig of config_1.logsConfig) {
        const filePath = `${config_1.LOGS_DIR_NAME}/${logConfig.id}.log`;
        try {
            await (0, s3_tools_1.downloadS3FileToDisk)(filePath, filePath);
        }
        catch (err) {
            console.warn(`Warning: Log file could not be downloaded from S3: ${filePath} error: ${(0, tryToGetErrorMessage_1.tryToGetErrorMessage)(err)}`);
        }
    }
}
exports.fromS3ToDisk = fromS3ToDisk;
//# sourceMappingURL=log-storage-s3.js.map