import styled from "styled-components";

export const DrawerContainer = styled("div")`
   display: flex;
   flex-direction: row;
   width: 100%;
   height: 100vh;
`;

export const ChildrenContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded"].includes(p)
})<{ expanded?: boolean }>`
   padding-right: 5px;
   padding-left: 5px;
   ${({ expanded }) => (expanded ? "width: 210px;" : "width: 80px;")}
   ${({ expanded }) => (!expanded ? "padding: 0 15px;" : "")}
   overflow-x: hidden;
   height: 100%;
   z-index: 1;
   background: ${({ theme, expanded }) => theme.colors.background2};
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);

   & .MuiButtonBase-root {
      justify-content: flex-start;
   }
`;

export const PageContainer = styled("div")`
   width: 100%;
`;

export const ButtonsContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded"].includes(p)
})<{ expanded?: boolean }>`
   display: flex;
   flex-direction: column;
   row-gap: 0px;
   ${({ expanded }) => (!expanded ? "transform: scale(1.2);" : "")}
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
`;

export const LogoContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded"].includes(p)
})<{ expanded?: boolean }>`
   margin: 40px 0;
   width: 100%;
   height: 40px;
   ${({ expanded }) => (expanded ? "transform: scale(1.3);" : "")}
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
`;
