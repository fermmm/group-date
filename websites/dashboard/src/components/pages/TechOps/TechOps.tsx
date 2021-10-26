import React, { FC, useState } from "react";
import { ButtonsContainer } from "./styles.TechOps";
import ButtonLoadDatabaseBackup from "./ButtonLoadDatabaseBackup/ButtonLoadDatabaseBackup";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";
import CardColumn from "../../common/UI/CardColumn/CardColumn";

const TechOps: FC = () => {
   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <ButtonLoadDatabaseBackup />
            <RunCommandForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
