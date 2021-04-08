import * as winston from "winston";

export enum LogChannels {
   Info = "info",
}

const logger = winston.createLogger({
   level: LogChannels.Info,
   format: winston.format.json(),
   defaultMeta: { service: "user-service" },
   transports: [
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
      new winston.transports.File({ dirname: "logs", filename: "error.log", level: "error" }),
      new winston.transports.File({ dirname: "logs", filename: "combined.log" }),
   ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
   logger.add(
      new winston.transports.Console({
         format: winston.format.simple(),
      }),
   );
}

/**
 * Like and advanced console.log() that saves the log to files using winston.js library.
 */
export function logToFiles(message: string, channel: LogChannels = LogChannels.Info) {
   logger.log(channel, message);
}
