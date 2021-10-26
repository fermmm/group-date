import LoadingButton from "@mui/lab/LoadingButton";
import React, { FC } from "react";
import { Column } from "../../../common/UI/Column/Column";

const RunCommandForm: FC = () => {
   const handleClick = () => {};

   return (
      <Column>
         <LoadingButton loading={false} variant="outlined" onClick={handleClick}>
            Run
         </LoadingButton>
      </Column>
   );
};

export default RunCommandForm;
