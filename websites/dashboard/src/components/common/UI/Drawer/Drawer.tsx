import React, { FC, ReactNode, useState } from "react";
import {
   DrawerContainer,
   ChildrenContainer,
   LogoContainer,
   ButtonsContainer,
   PageContainer
} from "./styles.Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import logo from "../../../../assets/logo.png";

interface PropsDrawer {
   buttons: Array<{
      icon: () => ReactNode;
      label: string;
      onClick: () => void;
   }>;
}

const Drawer: FC<PropsDrawer> = ({ children, buttons }) => {
   const [expanded, setExpanded] = useState(false);

   const handleDrawerExpand = () => {
      setExpanded(true);
   };

   const handleDrawerContract = () => {
      setExpanded(false);
   };

   return (
      <DrawerContainer>
         <ChildrenContainer
            expanded={expanded}
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
            <ButtonsContainer expanded={expanded}>
               {buttons.map(button => (
                  <ListItem button key={button.label} onClick={button.onClick}>
                     <ListItemIcon>{button.icon()}</ListItemIcon>
                     <ListItemText primary={button.label} />
                  </ListItem>
               ))}
            </ButtonsContainer>
         </ChildrenContainer>
         <PageContainer>{children}</PageContainer>
      </DrawerContainer>
   );
};

export default Drawer;
