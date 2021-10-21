import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFilePicker } from "use-file-picker";
import {
   ButtonsContainer,
   JsonTextContainer,
   ResponseTextContainer,
   TechOpsContainer
} from "./styles.TechOps";
import ButtonLoadDatabaseBackup from "./ButtonLoadDatabaseBackup/ButtonLoadDatabaseBackup";

const TechOps: FC = () => {
   const [response, setResponse] = useState<string>();

   return (
      <TechOpsContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            {response && (
               <ResponseTextContainer>
                  <h3>Response received</h3>
                  <JsonTextContainer dangerouslySetInnerHTML={{ __html: response }} />
               </ResponseTextContainer>
            )}
            <ButtonLoadDatabaseBackup onResponse={setResponse} />
         </ButtonsContainer>
      </TechOpsContainer>
   );
};

export default TechOps;
