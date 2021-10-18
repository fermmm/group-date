import LoadingButton from "@mui/lab/LoadingButton";
import React, { FC, useState } from "react";
import { loadCSVRequest } from "../../../api/server/techOps";
import { ButtonsContainer, ResponseTextContainer, TechOpsContainer } from "./styles.TechOps";

const TechOps: FC = () => {
   const [loading, setLoading] = useState();
   const [response, setResponse] = useState<string>();

   const handleLoadCsv = async () => {
      setResponse(JSON.stringify(await loadCSVRequest({ fileId: "latest" })));
   };

   return (
      <TechOpsContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            {response && (
               <ResponseTextContainer>
                  <h3>Response received</h3>
                  {response}
               </ResponseTextContainer>
            )}
            <LoadingButton loading={loading} variant="outlined" onClick={handleLoadCsv}>
               Load CSV
            </LoadingButton>
         </ButtonsContainer>
      </TechOpsContainer>
   );
};

export default TechOps;
