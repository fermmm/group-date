import styled from "styled-components";
import { Row } from "../../../../common/UI/Row/Row";
import { IconButton } from "@mui/material";
import JsonText from "../../../../common/UI/JsonText/JsonText";

export const LogItemContainer = styled(Row).withConfig({
   shouldForwardProp: p => !["hovered"].includes(p),
})<{ hovered?: boolean }>`
   gap: 8px;
   padding: 10px;
   padding-bottom: 5px;
   border-radius: 10px;
   align-items: center;
   ${({ hovered }) => hovered && `background-color: #2c2c2c;`}
`;

export const LogItemIcon = styled(IconButton)`
   height: fit-content;
`;

export const TimeLabel = styled("pre")`
   word-break: "break-all";
   font-size: 0.9em;
`;

export const JsonTextStyled = styled(JsonText)`
   margin-left: 20px;
`;
