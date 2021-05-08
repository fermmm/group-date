import Menu from "@material-ui/core/Menu";
import styled from "styled-components";

export const MenuStyled = styled(Menu)`
   margin-top: 25px;
   ul {
      min-width: 150px;
   }
`;

export const UnanchoredContainer = styled("div")`
   width: fit-content;
   min-width: 150px;
`;
