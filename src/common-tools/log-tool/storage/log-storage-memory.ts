import { getFileContent, readFolder, writeFile } from "../../files-tools/files-tools";
import { ENTRY_SEPARATOR_STRING, LOGS_DIR_NAME } from "../config";

// TODO: Esto esta todo testeado y funcionando, ahora hay que programar lo de AWS y estamos

let logsInMemory: Partial<Record<string, string>> = {};
const logsPendingToSave = new Set<string>();

export function getInMemoryLog(logId: string) {
   return logsInMemory[logId] ?? "";
}

export function setInMemoryLog(logId: string, newLogContent: string) {
   logsInMemory[logId] = newLogContent;
   logsPendingToSave.add(logId);
}

export function deleteInMemoryLogEntry(logId: string, entryId: string) {
   const currentLogInMem = getInMemoryLog(logId);

   const newLogContent = currentLogInMem
      .split(ENTRY_SEPARATOR_STRING)
      .filter(log => JSON.parse(log).entryId !== entryId)
      .join(ENTRY_SEPARATOR_STRING);

   setInMemoryLog(logId, newLogContent);
}

export function getAllInMemoryLogs() {
   return logsInMemory;
}

export function getLogsPendingToSave() {
   return Array.from(logsPendingToSave);
}

export function clearLogsPendingToSave() {
   logsPendingToSave.clear();
}
