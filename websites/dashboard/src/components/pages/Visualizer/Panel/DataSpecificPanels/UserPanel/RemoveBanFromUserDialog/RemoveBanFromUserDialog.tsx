import React, { FC, useState } from "react";
import { Autocomplete, Button, Dialog, DialogActions, DialogTitle, TextField } from "@mui/material";
import { UserBanReason } from "../../../../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import { DialogContentStyled } from "./styles.RemoveBanFromUserDialog";
import { User } from "../../../../../../../api/tools/shared-tools/endpoints-interfaces/user";
import { decodeString } from "../../../../../../../api/tools/shared-tools/utility-functions/decodeString";

interface PropsRemoveBanFromUserDialog {
   open: boolean;
   user: Partial<User>;
   onContinueClick: (reason: UserBanReason) => void;
   onClose: () => void;
}

const RemoveBanFromUserDialog: FC<PropsRemoveBanFromUserDialog> = props => {
   const { open, user, onContinueClick, onClose } = props;
   const [reason, setReason] = useState<UserBanReason>(null);

   const handleContinueClick = () => {
      onContinueClick(reason);
      onClose();
   };

   const getUserBanReasons = () => {
      try {
         return JSON.parse(decodeString((user.banReasons as unknown as string) || "[]"));
      } catch (e) {
         return [];
      }
   };

   return (
      <Dialog open={open} keepMounted onClose={onClose} aria-describedby="alert-dialog-slide-description">
         <DialogTitle>Remove ban from user</DialogTitle>
         <DialogContentStyled>
            <Autocomplete
               options={getUserBanReasons()}
               value={reason}
               onChange={(event: any, value: UserBanReason | null | string) => {
                  if (typeof value === "string") {
                     setReason(value as UserBanReason);
                  }
               }}
               // getOptionLabel={(option: UserBanReason) => {
               //    return option;
               // }}
               renderInput={params => (
                  <TextField {...params} label="Select ban reason to remove" variant="outlined" />
               )}
            />
         </DialogContentStyled>
         <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleContinueClick}>Remove ban</Button>
         </DialogActions>
      </Dialog>
   );
};

export default RemoveBanFromUserDialog;
