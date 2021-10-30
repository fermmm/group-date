import styled from "styled-components";
import { LazyLog } from "react-lazylog";

export const LogsContainer = styled("div")`
   width: 100%;
   height: 100vh;
   overflow: hidden;
   position: relative;
`;

export const ContextMenuContainer = styled("div")`
   position: absolute;
   top: 0px;
   padding: 5px 88px;
`;

export const LogFileFeedbackMessage = styled("div")`
   display: flex;
   align-items: flex-start;
   justify-content: center;
   width: 100%;
   height: 100vh;
   padding-top: 150px;
`;

export const LazyLogStyled = styled(LazyLog)`
   font-size: 12.5px;
   font-family: monospace;
   background-color: black;

   div {
      display: flex;
      flex-direction: row;
   }

   span {
      user-select: text;
      white-space: pre;
   }
`;
