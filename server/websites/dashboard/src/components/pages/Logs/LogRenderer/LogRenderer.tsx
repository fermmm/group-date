import React, { FC } from "react";
import { LogResponse } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import { JsonTextContainer } from "../../TechOps/ResponseDisplay/styles.ResponseDisplay";

interface PropsLogRenderer {
   log: LogResponse;
   onEntryDelete: (logId: string, entryId: string) => void;
}

const LogRenderer: FC<PropsLogRenderer> = props => {
   return <>{JSON.stringify(props.log)}</>;
};

export default LogRenderer;
