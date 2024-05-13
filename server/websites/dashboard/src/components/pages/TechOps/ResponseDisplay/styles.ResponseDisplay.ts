import styled from "styled-components";

export const ResponseTextContainer = styled("div")`
   width: 100%;
`;

export const JsonTextContainer = styled("div")`
   overflow-x: auto;
   overflow-y: auto;
   max-height: 500px;
   background-color: black;
   padding: 10px;
   padding-top: 20px;
   padding-bottom: 20px;
   border-radius: 6px;
`;

export const ResponseLine = styled("pre")`
   color: green;
   background-color: black;
   white-space: pre-wrap;
   font-size: 14px;
   margin: 0;
   margin-bottom: 6px;
`;
