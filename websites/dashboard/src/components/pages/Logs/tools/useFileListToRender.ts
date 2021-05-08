import { useMemo } from "react";

export function useFileListToRender(fileList: string[] | undefined) {
   return useMemo(() => fileList?.map(file => ({ label: file.split(".")[0], value: file })) ?? [], [
      fileList
   ]);
}
