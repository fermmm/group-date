import Button from "@material-ui/core/Button";
import React, { FC, useState } from "react";
import { LazyLog } from "react-lazylog";
import { useLog, useLogsFileList } from "../../../api/server/logs";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { RequestsStatus } from "../../common/UI/RequestStatus/RequestStatus";
import { ContextMenuContainer, LogsContainer } from "./styles.Logs";
import { useFileListToRender } from "./tools/useFileListToRender";

const Logs: FC = () => {
   const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
   const [selectedLogFileName, setSelectedLogFileName] = useState<string | null>(null);
   const { data: fileList, isLoading: fileListLoading, error: fileListError } = useLogsFileList();
   const { data: log, isLoading: logLoading, error: logError } = useLog({
      params: { fileName: selectedLogFile },
      options: { enabled: selectedLogFile != null }
   });
   const fileListToRender = useFileListToRender(fileList);

   const handleLogFileChange = (
      logSelectedName: string | null,
      logSelectedValue: string | null
   ) => {
      if (logSelectedValue == null) {
         return;
      }

      setSelectedLogFile(logSelectedValue);
      setSelectedLogFileName(logSelectedName);
   };

   return (
      <RequestsStatus loading={[fileListLoading, logLoading]} error={[fileListError, logError]}>
         <LogsContainer>
            {selectedLogFile && (
               <LazyLog
                  enableSearch
                  text={log ?? " "}
                  caseInsensitive
                  containerStyle={{ color: "#48b951" }}
               />
            )}
            <ContextMenuContainer>
               <ContextMenu
                  startOpened
                  onClose={handleLogFileChange}
                  buttons={fileListToRender}
                  buttonToOpen={onClick => (
                     <Button onClick={onClick}>
                        {selectedLogFile ? "File: " + selectedLogFileName : "Select log file"}
                     </Button>
                  )}
               />
            </ContextMenuContainer>
         </LogsContainer>
      </RequestsStatus>
   );
};

export default Logs;
