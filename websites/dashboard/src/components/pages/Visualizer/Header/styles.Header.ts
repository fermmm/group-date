import styled from "styled-components";
import { TextField } from "@mui/material";

export const HeaderContainer = styled("div")`
   display: flex;
   flex-direction: row;
   position: absolute;
   justify-content: center;
   width: 100%;
   height: 40px;
   margin-top: 27px;
   z-index: 2;
`;

export const FormContainer = styled("div")`
   display: flex;
   flex-direction: row;
   column-gap: 10px;
   width: 60%;
   min-width: 200px;
   height: 100%;
`;

export const QueryTextField = styled(TextField)`
   & .MuiInputBase-input {
      background-color: ${({ theme }) => theme.colors.background2};
   }
`;

export const NodeLimitTextField = styled(TextField)`
   max-width: 55px;
   margin-left: 20px !important;

   & .MuiInputBase-input {
      background-color: ${({ theme }) => theme.colors.background2};
   }
`;
