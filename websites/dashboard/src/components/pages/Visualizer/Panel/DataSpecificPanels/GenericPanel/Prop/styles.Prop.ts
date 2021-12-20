import styled from "styled-components";

export const MainContainer = styled("div")`
   display: flex;
   flex-direction: row;
   justify-content: space-between;
   align-items: center;
   max-width: 100%;
`;

export const KeyLabel = styled("div")`
   font-size: 16px;
   font-weight: 400;
`;

export const ValueLabel = styled("div")`
   font-size: 19px;
   font-weight: 200;
   padding-left: 25px;
`;

export const NonEditModeContainer = styled("div")`
   display: flex;
   flex-direction: column;
   width: 100%;
   min-width: 0;
`;
