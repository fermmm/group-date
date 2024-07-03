import React, { FC } from "react";

interface PropsPageContainer {
   children: React.ReactNode;
}

const PageContainer: FC<PropsPageContainer> = ({ children }) => {
   return <div className="">{children}</div>;
};

export default PageContainer;
