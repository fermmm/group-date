import React, { FC } from "react";
import { ButtonsContainer } from "./styles.TechOps";
import ImportExportForm from "./ImportExportForm/ImportExportForm";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import RunCommandForm from "./RunCommandForm/RunCommandForm";
import SendEmailForm from "./SendEmailForm/SendEmailForm";
import NotificationStatusForm from "./NotificationStatusForm/NotificationStatusForm";
import SendQueryForm from "./SendQueryForm/SendQueryForm";

const TechOps: FC = () => {
   return (
      <DashboardPageContainer>
         <h1>Tech operations</h1>
         <ButtonsContainer>
            <ImportExportForm />
            <SendQueryForm />
            <RunCommandForm />
            <SendEmailForm />
            <NotificationStatusForm />
         </ButtonsContainer>
      </DashboardPageContainer>
   );
};

export default TechOps;
