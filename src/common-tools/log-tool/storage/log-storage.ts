import { isRunningOnAws } from "../../process/process-tools";
import { fromDiskToMemoryLogs, fromMemoryLogsToDisk } from "./log-storage-disk";
import { fromDiskToS3, fromS3ToDisk } from "./log-storage-s3";

export async function restoreLogs() {
   if (isRunningOnAws()) {
      await fromS3ToDisk();
   }

   fromDiskToMemoryLogs();
}

export async function backupLogs(specificLogs?: string[]) {
   fromMemoryLogsToDisk();

   if (isRunningOnAws()) {
      await fromDiskToS3(specificLogs);
   }
}
