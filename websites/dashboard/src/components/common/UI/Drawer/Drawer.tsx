import React, { FC, ReactNode, useState } from "react";
import {
   DrawerContainer,
   ChildrenContainer,
   LogoContainer,
   ButtonsContainer,
   PageContainer,
   ListItemStyled
} from "./styles.Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import logo from "../../../../assets/logo.png";

interface PropsDrawer {
   buttons: Array<{
      icon: () => ReactNode;
      label: string;
      marginBottom?: number;
      onClick: () => void;
   }>;
}

const Drawer: FC<PropsDrawer> = props => {
   const { children, buttons } = props;
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
               ))}
            </ButtonsContainer>
         </ChildrenContainer>
         <PageContainer>{children}</PageContainer>
      </DrawerContainer>
   );
};

export default Drawer;
