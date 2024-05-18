import styled from "styled-components";
import { Row } from "../../common/UI/Row/Row";

export const ContextMenuContainer = styled("div")`
   padding-top: 5px;
   padding-bottom: 5px;
   padding-left: 96px;
`;

export const LogFileFeedbackMessage = styled("div")`
   display: flex;
   align-items: flex-start;
   justify-content: center;
   width: 100%;
   height: 100vh;
   padding-top: 150px;
`;

export const LogDescription = styled(Row)`
   align-items: center;
   gap: 10px;
   padding-left: 50px;
   width: fit-content;
`;
