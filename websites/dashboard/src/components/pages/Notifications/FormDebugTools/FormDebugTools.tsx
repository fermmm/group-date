import { Checkbox, FormControlLabel } from "@mui/material";
import React, { ChangeEvent, FC, useEffect, useState } from "react";
import { FormContainer } from "../common/containers";

export interface PropsDebugTools {
   onChange: (options: NotificationDebugOptions) => void;
}

export interface NotificationDebugOptions {
   logResult: boolean;
}

const FormDebugTools: FC<PropsDebugTools> = props => {
   const [logResult, setLogResult] = useState<boolean>(false);

   useEffect(() => {
      props.onChange({ logResult });
   }, [logResult]);

   return (
      <FormContainer>
         <FormControlLabel
            label={"Log result"}
            control={
               <Checkbox
                  checked={logResult}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLogResult(e.target.checked)}
                  inputProps={{ "aria-label": "controlled" }}
               />
            }
         />
      </FormContainer>
   );
};

export default FormDebugTools;
