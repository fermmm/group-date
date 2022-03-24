import { downloadS3FileToDisk, uploadFileToS3 } from "../../aws/s3-tools";
import { readFolder } from "../../files-tools/files-tools";
import { logsConfig, LOGS_DIR_NAME } from "../config";

export async function fromDiskToS3(specificLogs?: string[]) {
   const fileNames = readFolder(LOGS_DIR_NAME);

   for (const fileName of fileNames) {
      if (specificLogs?.length > 0) {
         const fileNameWithoutExtension = fileName.split(".")[0];
         if (!specificLogs.includes(fileNameWithoutExtension)) {
            continue;
         }
      }

      const filePath = `${LOGS_DIR_NAME}/${fileName}`;
      await uploadFileToS3({ localFilePath: filePath, s3TargetPath: filePath });
   }
}

export async function fromS3ToDisk() {
   for (const logConfig of logsConfig) {
      const filePath = `${LOGS_DIR_NAME}/${logConfig.id}.log`;
      await downloadS3FileToDisk(filePath, filePath);
   }
}
