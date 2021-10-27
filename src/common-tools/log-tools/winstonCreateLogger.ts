import * as moment from "moment";
import * as winston from "winston";

export enum LogChannels {
   Info = "info",
}

export function createLog(fileName: string) {
   if (process.env.GENERATE_LOGS !== "true") {
      return;
   }

   return winston.createLogger({
      level: LogChannels.Info,
      format: winston.format.combine(
         winston.format.timestamp({ format: () => String(moment().unix()) }),
         winston.format.json(),
      ),
      transports: [
         new winston.transports.File({
            dirname: "logs",
            filename: fileName,
            level: LogChannels.Info,
            maxsize: 30000, // 30kb
            maxFiles: 1,
         }),
      ],
   });
}
