import React, { FC, useState } from "react";
import Button from "@mui/material/Button";
import { VscInfo } from "react-icons/vsc";
import { deleteLogEntryPost, useLog, useLogsFileList } from "../../../api/server/logs";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { RequestStatus } from "../../common/UI/RequestStatus/RequestStatus";
import { ContextMenuContainer, LogDescription, LogFileFeedbackMessage } from "./styles.Logs";
import { useFileListToRender } from "./tools/useFileListToRender";
import LogList from "./LogRenderer/LogList";
import { Column } from "../../common/UI/Column/Column";
import { Row } from "../../common/UI/Row/Row";

const Logs: FC = () => {
   const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
   const [selectedLogFileName, setSelectedLogFileName] = useState<string | null>(null);
   const { data: fileList, isLoading: fileListLoading, error: fileListError } = useLogsFileList();
   const {
      data: currentLog,
      isLoading: logLoading,
      error: logError,
      refetch: refetchLog,
   } = useLog({
      params: { logId: selectedLogId },
      options: { enabled: selectedLogId != null },
   });
   const fileListToRender = useFileListToRender(fileList);

   const handleLogFileChange = (logSelectedName: string | null, logSelectedValue: string | null) => {
      if (logSelectedValue == null) {
         return;
      }

      setSelectedLogId(logSelectedValue);
      setSelectedLogFileName(logSelectedName);
   };

   const handleEntryDelete = async (logId: string, entryId: string) => {
      await deleteLogEntryPost({ entryId, logId: logId });
      refetchLog();
   };

   return (
      <Column style={{ width: "100%", height: "100%" }}>
         <Row>
            <ContextMenuContainer>
               <ContextMenu
                  startOpened
                  onClose={handleLogFileChange}
                  buttons={fileListToRender}
                  buttonToOpen={onClick => (
                     <Button onClick={onClick}>
                        {selectedLogId ? "File: " + selectedLogFileName : "Select log file"}
                     </Button>
                  )}
               />
            </ContextMenuContainer>
            {currentLog && (
               <LogDescription>
                  <VscInfo />
                  {currentLog?.description}
               </LogDescription>
            )}
         </Row>
         <RequestStatus loading={[fileListLoading, logLoading]} error={[fileListError, logError]}>
            {currentLog ? (
               <LogList log={currentLog} onEntryDelete={handleEntryDelete} />
            ) : (
               <LogFileFeedbackMessage>Log file is empty</LogFileFeedbackMessage>
            )}
         </RequestStatus>
      </Column>
   );
};

export default Logs;
