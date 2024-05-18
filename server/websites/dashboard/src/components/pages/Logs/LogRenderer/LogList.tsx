import React, { FC, useEffect } from "react";
import { LogResponse } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import LogItem from "./LogList/LogItem";
import { LogListContainer } from "./styles.logList";

interface PropsLogRenderer {
   log: LogResponse;
   onEntryDelete: (logId: string, entryId: string) => void;
}

const LogList: FC<PropsLogRenderer> = props => {
   const { log, onEntryDelete } = props;
   const scrollRef = React.useRef<HTMLDivElement>(null);
   const logItems: Array<Record<string, string>> = log.log.split("____end").map(item => JSON.parse(item));

   useEffect(() => {
      scrollToBottom();
   }, [log?.id]);

   const scrollToBottom = () => {
      scrollRef.current?.scrollTo?.(0, scrollRef.current.scrollHeight);
   };

   return (
      <LogListContainer ref={scrollRef}>
         {logItems.map((item, i) => (
            <LogItem
               timestamp={Number(item.timestamp)}
               onTrashIconClick={() => onEntryDelete(log.id, item.entryId)}
               logText={JSON.stringify(item.content)}
               key={item.entryId}
            />
         ))}
      </LogListContainer>
   );
};

export default LogList;
