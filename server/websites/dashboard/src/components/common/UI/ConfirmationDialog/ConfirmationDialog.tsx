import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import React, { FC } from "react";

export interface PropsConfirmationDialog {
   open?: boolean;
   onContinueClick?: () => void;
   onClose?: () => void;
   title?: string;
   text?: string;
   continueButtonText?: string;
   cancelButtonText?: string;
   continueButtonIsRed?: boolean;
}

const ConfirmationDialog: FC<PropsConfirmationDialog> = props => {
   const {
      open = false,
      onContinueClick,
      onClose,
      title,
      text,
      continueButtonText,
      cancelButtonText,
      continueButtonIsRed,
   } = props;

   const handleContinueClick = () => {
      onContinueClick?.();
      onClose?.();
   };

   return (
      <Dialog open={open} keepMounted onClose={onClose} aria-describedby="alert-dialog-slide-description">
         {title && <DialogTitle>{title}</DialogTitle>}
         <DialogContent>
            <DialogContentText>{text}</DialogContentText>
         </DialogContent>
         <DialogActions>
            <Button onClick={onClose}>{cancelButtonText ?? "Cancel"}</Button>
            <Button onClick={handleContinueClick} color={continueButtonIsRed ? "error" : undefined}>
               {continueButtonText ?? "Continue"}
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default ConfirmationDialog;
