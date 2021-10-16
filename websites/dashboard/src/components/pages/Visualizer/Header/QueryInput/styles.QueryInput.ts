import { Autocomplete } from "@mui/material";
import styled from "styled-components";

export const AutocompleteTextField = styled(Autocomplete)`
   background-color: ${({ theme }) => theme.colors.background2};
   & .MuiInputBase-input {
      background-color: ${({ theme }) => theme.colors.background2};
   }
`;
