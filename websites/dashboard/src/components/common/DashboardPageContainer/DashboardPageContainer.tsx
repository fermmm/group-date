import React, { FC } from "react";
import { MainContainer, ScrollContainer } from "./styles.DashboardPageContainer";

const DashboardPageContainer: FC = ({ children }) => {
   return (
      <ScrollContainer>
         <MainContainer>{children}</MainContainer>
      </ScrollContainer>
   );
};

export default DashboardPageContainer;
