import { TextField } from "@mui/material";
import React, { FC, useState } from "react";
import { FormContainer } from "../common/containers";

export interface PropsEmailSelector {
   onChange: (emails: string[]) => void;
}

const FormEmailSelector: FC<PropsEmailSelector> = props => {
   const [emailsInput, setEmailsInput] = useState<string>();

   const handleInputChange = (inputValue: string) => {
      setEmailsInput(inputValue);
      props.onChange(inputValue.replace(/\s/g, "").split(","));
   };

   return (
      <FormContainer>
         To send the notification to specific users complete this with comma separated emails. The
         emails are used to locate the accounts for the notification (not to send an email).
         <TextField
            label="To specific users"
            variant="outlined"
            multiline
            fullWidth
            value={emailsInput}
            onChange={e => handleInputChange(e.target.value)}
         />
      </FormContainer>
   );
};

export default FormEmailSelector;
