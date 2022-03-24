"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCodeFromString = void 0;
const tryToGetErrorMessage_1 = require("../httpRequest/tools/tryToGetErrorMessage");
async function runCodeFromString(code) {
    let result;
    // Add here as require imports all the function you want available
    const { fromS3ToDisk } = require("../log-tool/storage/log-storage-s3");
    const { log } = require("../log-tool/log");
    const { LogId } = require("../log-tool/types");
    const { getAllInMemoryLogs } = require("../log-tool/storage/log-storage-memory");
    try {
        const func = eval(`async () => {return ${code}}`);
        result = await func();
    }
    catch (e) {
        result = (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e);
    }
    return result;
}
exports.runCodeFromString = runCodeFromString;
//# sourceMappingURL=runCodeFromString.js.map