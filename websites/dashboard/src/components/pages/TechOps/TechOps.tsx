import React, { FC } from "react";
import { ButtonsContainer } from "./styles.TechOps";
import ButtonImportDatabaseContent from "./ButtonImportDatabaseContent/ButtonImportDatabaseContent";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";
import SendEmailForm from "./SendEmailForm/SendEmailForm";

const TechOps: FC = () => {
   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <ButtonImportDatabaseContent />
            <RunCommandForm />
            <SendEmailForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
