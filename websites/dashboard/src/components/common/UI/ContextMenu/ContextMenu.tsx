import React, { FC, ReactElement, useState } from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import MenuList from "@material-ui/core/MenuList";
import { MenuStyled, UnanchoredContainer } from "./styles.ContextMenu";

export interface SimpleDialogProps {
   buttonToOpen: (onClick: (e: React.MouseEvent<HTMLButtonElement>) => void) => ReactElement;
   buttons: DialogButton[];
   onClose: (label: string | null, value: string | null) => void;
   startOpened?: boolean;
}

export interface DialogButton {
   label: string;
   value: string;
   icon?: () => ReactElement;
}

const ContextMenu: FC<SimpleDialogProps> = props => {
   const { onClose, buttons, buttonToOpen, startOpened } = props;
   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
   const [open, setOpen] = useState(startOpened ?? false);

   const handleClose = () => {
      setOpen(false);
      onClose(null, null);
   };

   const handleListItemClick = (label: string, value: string) => {
      setOpen(false);
      onClose(label, value);
   };

   const handleOpenerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      setOpen(true);
   };

   const renderButton = (button: DialogButton) => {
      return (
         <MenuItem
            onClick={() => handleListItemClick(button.label, button.value)}
            key={button.value}
         >
            {button.icon && button.icon()}
            {button.label}
         </MenuItem>
      );
   };

   return (
      <>
         {buttonToOpen(handleOpenerClick)}
         {anchorEl ? (
            <MenuStyled
               onClose={handleClose}
               open={open}
               anchorEl={anchorEl}
               keepMounted
               transformOrigin={{
                  vertical: "top",
                  horizontal: "left"
               }}
            >
               {buttons.map(button => renderButton(button))}
            </MenuStyled>
         ) : (
            open && (
               <UnanchoredContainer>
                  <Paper elevation={6}>
                     <MenuList>{buttons.map(button => renderButton(button))}</MenuList>
                  </Paper>
               </UnanchoredContainer>
            )
         )}
      </>
   );
};

export default ContextMenu;
