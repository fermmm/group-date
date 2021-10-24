import { CardContent } from "@mui/material";
import styled from "styled-components";
import { ColumnCentered } from "../../common/UI/Column/Column";

export const CardContentStyled = styled(CardContent)`
   display: flex;
   flex-direction: column;
   align-items: flex-start;
   row-gap: 20px;
`;

export const ContinueButtonContainer = styled(ColumnCentered)`
   margin-top: 20px;
   width: 100%;
`;
