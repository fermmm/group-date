import React, { FC, useState } from "react";
import Button from "@mui/material/Button";
import { useLog, useLogsFileList } from "../../../api/server/logs";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { RequestStatus } from "../../common/UI/RequestStatus/RequestStatus";
import { ContextMenuContainer, LogFileFeedbackMessage } from "./styles.Logs";
import { useFileListToRender } from "./tools/useFileListToRender";
import LogRenderer from "./LogRenderer/LogRenderer";

const Logs: FC = () => {
   const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
   const [selectedLogFileName, setSelectedLogFileName] = useState<string | null>(null);
   const { data: fileList, isLoading: fileListLoading, error: fileListError } = useLogsFileList();
   const {
      data: log,
      isLoading: logLoading,
      error: logError,
   } = useLog({
      params: { fileName: selectedLogFile },
      options: { enabled: selectedLogFile != null },
   });
   const fileListToRender = useFileListToRender(fileList);

   const handleLogFileChange = (logSelectedName: string | null, logSelectedValue: string | null) => {
      if (logSelectedValue == null) {
         return;
      }

      setSelectedLogFile(logSelectedValue);
      setSelectedLogFileName(logSelectedName);
   };

   return (
      <>
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
         <RequestStatus loading={[fileListLoading, logLoading]} error={[fileListError, logError]}>
            {log ? (
               <LogRenderer log={log} />
            ) : (
               <LogFileFeedbackMessage>Log file is empty</LogFileFeedbackMessage>
            )}
         </RequestStatus>
      </>
   );
};

export default Logs;
