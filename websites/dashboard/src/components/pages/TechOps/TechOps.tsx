import LoadingButton from "@mui/lab/LoadingButton";
import React, { FC, useState } from "react";
import { loadCSVRequest } from "../../../api/server/techOps";
import { ButtonsContainer, TechOpsContainer } from "./styles.TechOps";

const TechOps: FC = () => {
   const [loading, setLoading] = useState();

   const handleLoadCsv = async () => {
      await loadCSVRequest({ fileId: "latest" });
   };

   return (
      <TechOpsContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <LoadingButton loading={loading} variant="outlined" onClick={handleLoadCsv}>
               Load CSV
            </LoadingButton>
         </ButtonsContainer>
      </TechOpsContainer>
   );
};

export default TechOps;
