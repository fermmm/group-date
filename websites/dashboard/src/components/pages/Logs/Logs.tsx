import React, { FC, useState } from "react";
import Button from "@mui/material/Button";
import { LazyLog } from "react-lazylog";
import { useLog, useLogsFileList } from "../../../api/server/logs";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { RequestStatus } from "../../common/UI/RequestStatus/RequestStatus";
import { ContextMenuContainer, LazyLogStyled, LogFileFeedbackMessage, LogsContainer } from "./styles.Logs";
import { useFileListToRender } from "./tools/useFileListToRender";
import { useReadabilityImprovements } from "./tools/useReadabilityImprovements";

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
   const improvedLog = useReadabilityImprovements(log);

   const handleLogFileChange = (logSelectedName: string | null, logSelectedValue: string | null) => {
      if (logSelectedValue == null) {
         return;
      }

      setSelectedLogFile(logSelectedValue);
      setSelectedLogFileName(logSelectedName);
   };

   return (
      <RequestStatus loading={[fileListLoading, logLoading]} error={[fileListError, logError]}>
         <LogsContainer>
            {log ? (
               <LazyLogStyled
                  enableSearch
                  text={improvedLog}
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
      </RequestStatus>
   );
};

export default Logs;
