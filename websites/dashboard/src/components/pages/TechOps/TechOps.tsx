import React, { FC } from "react";
import { ButtonsContainer } from "./styles.TechOps";
import ButtonImportDatabaseContent from "./ButtonImportDatabaseContent/ButtonImportDatabaseContent";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";

const TechOps: FC = () => {
   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <ButtonImportDatabaseContent />
            <RunCommandForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
