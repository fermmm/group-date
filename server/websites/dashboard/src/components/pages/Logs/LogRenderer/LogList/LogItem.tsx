import React, { FC, useState } from "react";
import { VscTrash } from "react-icons/vsc";
import { Column } from "../../../../common/UI/Column/Column";
import { humanizeUnixTimeStamp } from "../../../../../common-tools/strings/humanizeUnixTime";
import { JsonTextStyled, LogItemContainer, LogItemIcon, TimeLabel } from "./styles.LogItem";
import { Row } from "../../../../common/UI/Row/Row";

interface PropsLogItem {
   timestamp: number;
   logText: string;
   onTrashIconClick: () => void;
}

const LogItem: FC<PropsLogItem> = props => {
   const { timestamp, logText, onTrashIconClick } = props;
   const [hovered, setHovered] = useState(false);

   return (
      <LogItemContainer
         hovered={hovered}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
      >
         <Column>
            <TimeLabel>{humanizeUnixTimeStamp(timestamp)}</TimeLabel>
            <Row style={{ alignItems: "center" }}>
               <LogItemIcon onClick={() => onTrashIconClick()}>
                  <VscTrash style={{ visibility: hovered ? "unset" : "hidden" }} />
               </LogItemIcon>
               <JsonTextStyled jsonText={logText} />
            </Row>
         </Column>
      </LogItemContainer>
   );
};

export default LogItem;
