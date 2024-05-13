import React, { FC, useState } from "react";
import {
   Autocomplete,
   Button,
   Dialog,
   DialogActions,
   DialogContentText,
   DialogTitle,
   TextField,
} from "@mui/material";
import { UserBanReason } from "../../../../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import { DialogContentStyled } from "./styles.BanUserDialog";

interface PropsBanUserDialog {
   open: boolean;
   onContinueClick: (reason: UserBanReason) => void;
   onClose: () => void;
}

const BanUserDialog: FC<PropsBanUserDialog> = props => {
   const { open, onContinueClick, onClose } = props;
   const [reason, setReason] = useState<UserBanReason>(null);

   const handleContinueClick = () => {
      onContinueClick(reason);
      onClose();
   };

   return (
      <Dialog open={open} keepMounted onClose={onClose} aria-describedby="alert-dialog-slide-description">
         <DialogTitle>Ban user</DialogTitle>
         <DialogContentStyled>
            <Autocomplete
               options={Object.values(UserBanReason)}
               value={reason}
               onChange={(event: any, value: UserBanReason | null | string) => {
                  if (typeof value === "string") {
                     setReason(value as UserBanReason);
                  }
               }}
               getOptionLabel={(selected: UserBanReason) => {
                  return Object.entries(UserBanReason).filter(([key, value]) => value === selected)[0][0];
               }}
               renderInput={params => <TextField {...params} label="Select ban reason" variant="outlined" />}
            />
            {reason && (
               <DialogContentText>
                  <strong>Description:</strong>
                  <br />
                  {reason}
               </DialogContentText>
            )}
         </DialogContentStyled>
         <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleContinueClick}>Ban user</Button>
         </DialogActions>
      </Dialog>
   );
};

export default BanUserDialog;
