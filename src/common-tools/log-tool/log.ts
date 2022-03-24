import * as moment from "moment";
import { generateId } from "../string-tools/string-tools";
import { logsConfig, ENTRY_SEPARATOR_STRING } from "./config";
import { backupLogs } from "./storage/log-storage";
import { getInMemoryLog, setInMemoryLog } from "./storage/log-storage-memory";
import { LogId } from "./types";

export function log(content: Record<string, any>, logId: LogId) {
   if (process.env.GENERATE_LOGS !== "true") {
      return;
   }

   const config = logsConfig?.find(c => c.id === logId);

   if (config == null) {
      throw new Error(`LogId ${logId} not found`);
      return;
   }

   try {
      let currentLogInMem = getInMemoryLog(logId);

      if (config.maxEntries != null || config.maxEntryAge != null) {
         let logsAsArr = currentLogInMem.split(ENTRY_SEPARATOR_STRING);

         // If the log config requires to remove exceeding entries we do it here
         if (config.maxEntries != null) {
            if (logsAsArr.length > config.maxEntries) {
               logsAsArr = logsAsArr.slice(logsAsArr.length - config.maxEntries);
            }
         }

         // If the log config requires to remove dated entries wo do it here
         if (config.maxEntryAge != null) {
            logsAsArr = logsAsArr.filter(
               log => JSON.parse(log).timestamp > moment().unix() - config.maxEntryAge,
            );
         }

         currentLogInMem = logsAsArr.join(ENTRY_SEPARATOR_STRING);
      }

      if (currentLogInMem.length > 0) {
         currentLogInMem += ENTRY_SEPARATOR_STRING;
      }

      const entryId = generateId(6);
      const timestamp = moment().unix();

      currentLogInMem += JSON.stringify({ timestamp, entryId, content });

      setInMemoryLog(logId, currentLogInMem);

      if (config.backupAfterEntryAdded) {
         backupLogs([logId]);
      }
   } catch (error) {
      console.error(error);
   }
}
