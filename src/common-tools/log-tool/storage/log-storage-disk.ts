import { getFileContent, readFolder, writeFile } from "../../files-tools/files-tools";
import { LOGS_DIR_NAME } from "../config";
import {
   clearLogsPendingToSave,
   getAllInMemoryLogs,
   getLogsPendingToSave,
   setInMemoryLog,
} from "./log-storage-memory";

export function fromMemoryLogsToDisk() {
   const logsInMemory = getAllInMemoryLogs();

   getLogsPendingToSave().forEach(logId => {
      writeFile(`${LOGS_DIR_NAME}/${logId}.log`, logsInMemory[logId]);
   });

   clearLogsPendingToSave();
}

export function fromDiskToMemoryLogs() {
   readFolder(LOGS_DIR_NAME).forEach(fileName => {
      const fileNameWithoutExtension = fileName.split(".")[0];
      setInMemoryLog(fileNameWithoutExtension, getFileContent(`${LOGS_DIR_NAME}/${fileName}`));
   });
}
