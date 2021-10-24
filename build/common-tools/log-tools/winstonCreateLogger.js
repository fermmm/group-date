"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLog = exports.LogChannels = void 0;
const moment = require("moment");
const winston = require("winston");
var LogChannels;
(function (LogChannels) {
    LogChannels["Info"] = "info";
})(LogChannels = exports.LogChannels || (exports.LogChannels = {}));
function createLog(fileName) {
    if (process.env.GENERATE_LOGS !== "true") {
        return;
    }
    return winston.createLogger({
        level: LogChannels.Info,
        format: winston.format.combine(winston.format.timestamp({ format: () => String(moment().unix()) }), winston.format.json()),
        transports: [
            new winston.transports.File({
                dirname: "logs",
                filename: fileName,
                level: LogChannels.Info,
            }),
        ],
    });
}
exports.createLog = createLog;
//# sourceMappingURL=winstonCreateLogger.js.map