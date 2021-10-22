import React, { FC, ReactNode, useState } from "react";
import {
   DrawerContainer,
   ChildrenContainer,
   LogoContainer,
   ButtonsContainer,
   PageContainer,
   ListItemStyled,
   TooltipStyled
} from "./styles.Drawer";
import Zoom from "@mui/material/Zoom";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import logo from "../../../../assets/logo.png";
import { IconButton, Tooltip } from "@mui/material";

interface PropsDrawer {
   expandOnHover?: boolean;
   buttons: Array<{
      icon: () => ReactNode;
      label: string;
      marginBottom?: number;
      onClick: () => void;
   }>;
}

const Drawer: FC<PropsDrawer> = props => {
   const { children, buttons, expandOnHover } = props;
   const [expanded, setExpanded] = useState(false);

   const handleDrawerExpand = () => {
      if (expandOnHover) {
         setExpanded(true);
      }
   };

   const handleDrawerContract = () => {
      if (expandOnHover) {
         setExpanded(false);
      }
   };

   return (
      <DrawerContainer>
         <ChildrenContainer
            expanded={expanded}
            expandOnHover={expandOnHover}
            onMouseEnter={handleDrawerExpand}
            onMouseLeave={handleDrawerContract}
         >
            <LogoContainer expanded={expanded}>
               <img
                  src={logo}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  alt={"logo"}
               />
            </LogoContainer>
            <ButtonsContainer expanded={expanded} expandOnHover={expandOnHover}>
               {buttons.map(button =>
                  expandOnHover ? (
                     <ListItemStyled
                        //@ts-ignore
                        button={true}
                        key={button.label}
                        onClick={button.onClick}
                        style={{ marginBottom: button.marginBottom ?? 0 }}
                        sx={{ borderRadius: 2.2 }}
                     >
                        <ListItemIcon>{button.icon()}</ListItemIcon>
                        <ListItemText primary={button.label} />
                     </ListItemStyled>
                  ) : (
                     <TooltipStyled
                        title={button.label}
                        arrow
                        placement="right"
                        TransitionComponent={Zoom}
                        key={button.label}
                     >
                        <IconButton
                           onClick={button.onClick}
                           style={{ marginBottom: button.marginBottom ?? 0 }}
                        >
                           {button.icon()}
                        </IconButton>
                     </TooltipStyled>
                  )
               )}
            </ButtonsContainer>
         </ChildrenContainer>
         <PageContainer>{children}</PageContainer>
      </DrawerContainer>
   );
};

export default Drawer;
