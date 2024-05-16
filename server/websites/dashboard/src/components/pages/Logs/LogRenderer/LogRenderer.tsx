import React, { FC } from "react";
import { LogResponse } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";

interface PropsLogRenderer {
   log: LogResponse;
   onEntryDelete: (logId: string, entryId: string) => void;
}

const LogRenderer: FC<PropsLogRenderer> = props => {
   return <></>;
};

export default LogRenderer;
