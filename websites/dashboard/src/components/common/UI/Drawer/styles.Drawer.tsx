import ListItem, { ListItemProps } from "@mui/material/ListItem";
import styled from "styled-components";
import { styled as styledMui } from "@mui/material/styles";

const drawerWidthExpanded = 320;
const drawerWidthCollapsed = 80;

export const DrawerContainer = styled("div")`
   display: flex;
   flex-direction: row;
   width: 100%;
   height: 100vh;
   overflow: hidden;
`;

export const ChildrenContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded", "expandOnHover"].includes(p),
})<{ expanded?: boolean; expandOnHover?: boolean }>`
   padding-right: 5px;
   padding-left: 5px;
   ${({ expanded, expandOnHover }) =>
      expandOnHover
         ? expanded
            ? `width: ${drawerWidthExpanded}px;`
            : `width: ${drawerWidthCollapsed}px;`
         : ""}
   ${({ expanded }) => (!expanded ? "padding: 0 15px;" : "")}
   overflow-x: hidden;
   height: 100%;
   z-index: 1;
   background: ${({ theme, expanded }) => theme.colors.background2};
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);

   & .MuiButtonBase-root {
      justify-content: flex-start;
   }
`;

export const PageContainer = styled("div")`
   width: 100%;
`;

export const ButtonsContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded", "expandOnHover"].includes(p),
})<{ expanded?: boolean; expandOnHover?: boolean }>`
   display: flex;
   flex-direction: column;
   overflow-x: hidden;
   row-gap: 0px;
   ${({ expanded, expandOnHover }) => (expandOnHover && !expanded ? "transform: scale(1.2);" : "")}
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
   ${({ expandOnHover }) => (!expandOnHover ? "width: fit-content;" : "")}
`;

export const LogoContainer = styled("div").withConfig({
   shouldForwardProp: p => !["expanded"].includes(p),
})<{ expanded?: boolean }>`
   margin: 40px 0;
   width: 100%;
   height: 40px;
   ${({ expanded }) => (expanded ? "transform: scale(1.3);" : "")}
   transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
`;

export const ListItemStyled = styledMui(ListItem)<ListItemProps>(({ theme }) => ({
   width: drawerWidthExpanded,
}));

// export const TooltipStyled = styled(Tooltip)`
//    display: none;
//    & .MuiTooltip-tooltip {
//       display: none;
//       .MuiTooltip-tooltip {
//          color: red;
//       }
//    }
// `;
