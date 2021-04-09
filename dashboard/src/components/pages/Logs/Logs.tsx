import React, { FC, useMemo, useState } from "react";
import { LazyLog } from "react-lazylog";
import ContextMenu from "../../common/UI/ContextMenu/ContextMenu";
import { ChangeLogFab, LogsContainer } from "./styles.Logs";

const testUrl =
  "https://gist.githubusercontent.com/helfi92/96d4444aa0ed46c5f9060a789d316100/raw/ba0d30a9877ea5cc23c7afcd44505dbc2bab1538/typical-live_backing.log";

const Logs: FC = () => {
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  const token = useMemo(() => localStorage.getItem("token"), []);

  const handleLogFileChange = (logSelected: string | null) => {
    if (logSelected == null) {
      return;
    }

    setSelectedLogFile(logSelected);
  };

  return (
    <>
      <LogsContainer>
        <LazyLog
          enableSearch
          url={selectedLogFile != null ? testUrl : undefined}
          text={selectedLogFile == null ? " " : undefined}
          caseInsensitive
          containerStyle={{ color: "#48b951" }}
        />
        <ContextMenu
          onClose={handleLogFileChange}
          buttons={[
            { label: "holi", value: "olilki" },
            { label: "holi2", value: "olllllllll2" },
          ]}
          buttonToOpen={(onClick) => (
            <ChangeLogFab onClick={onClick}>
              File: {selectedLogFile}
            </ChangeLogFab>
          )}
        />
      </LogsContainer>
    </>
  );
};

export default Logs;
