import React, { FC, useState } from "react";
import { ButtonsContainer, JsonTextContainer, ResponseTextContainer } from "./styles.TechOps";
import ButtonLoadDatabaseBackup from "./ButtonLoadDatabaseBackup/ButtonLoadDatabaseBackup";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";

const TechOps: FC = () => {
   const [response, setResponse] = useState<string>();

   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            {response && (
               <ResponseTextContainer>
                  <h3>Response received</h3>
                  <JsonTextContainer dangerouslySetInnerHTML={{ __html: response }} />
               </ResponseTextContainer>
            )}
            <ButtonLoadDatabaseBackup onResponse={setResponse} />
            <RunCommandForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
