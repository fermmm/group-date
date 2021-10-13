import React, { FC, useState } from "react";
import Button from "@mui/material/Button";
import { LazyLog } from "react-lazylog";
import { useLog, useLogsFileList } from "../../../api/server/logs";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { RequestsStatus } from "../../common/UI/RequestStatus/RequestStatus";
import { ContextMenuContainer, LogFileFeedbackMessage, LogsContainer } from "./styles.Logs";
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
            {log ? (
               <LazyLog
                  enableSearch
                  text={log}
                  caseInsensitive
                  containerStyle={{ color: "#48b951" }}
               />
            ) : (
               <LogFileFeedbackMessage>Log file is empty</LogFileFeedbackMessage>
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
