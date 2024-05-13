import { useMemo } from "react";
import { LogFileListResponse } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";

export function useFileListToRender(fileList: LogFileListResponse[] | undefined) {
   return useMemo(
      () => fileList?.map(log => ({ label: log.logId.replaceAll("_", " "), value: log.logId })) ?? [],
      [fileList],
   );
}
