import styled from "styled-components";

export const PanelContainer = styled("div")`
   display: flex;
   align-items: center;
   justify-content: center;
   width: 40vw;
   min-width: 40vw;
   height: 300;
   padding: 25px 0;
   padding-right: 35px;
`;

export const PanelCard = styled("div")`
   position: relative;
   display: flex;
   flex-direction: column;
   overflow-y: auto;
   width: 100%;
   height: 100%;
   background-color: ${({ theme }) => theme.colors.background2};
   border-radius: 10px;
   padding: 5px 28px;
   row-gap: 20px;
   overflow-wrap: break-word;
`;

export const NodeElementTitle = styled("div")`
   font-size: 35px;
   font-weight: 200;
   margin-top: 20px;
   margin-bottom: 10px;
`;

export const NavigationButtonsContainer = styled("div")`
   display: flex;
   flex-direction: row;
   position: absolute;
   top: 20px;
   right: 25px;
   column-gap: 5px;
`;
