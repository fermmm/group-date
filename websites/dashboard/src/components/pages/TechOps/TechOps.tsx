import React, { FC } from "react";
import { ButtonsContainer } from "./styles.TechOps";
import ImportExportForm from "./ImportExportForm/ImportExportForm";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";
import SendEmailForm from "./SendEmailForm/SendEmailForm";

const TechOps: FC = () => {
   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <ImportExportForm />
            <RunCommandForm />
            <SendEmailForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
