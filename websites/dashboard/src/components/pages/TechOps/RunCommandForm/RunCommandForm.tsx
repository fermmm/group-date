import LoadingButton from "@mui/lab/LoadingButton";
import { Autocomplete, TextField } from "@mui/material";
import React, { FC, useState } from "react";
import { executeCommandRequest } from "../../../../api/server/techOps";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";

const RunCommandForm: FC = props => {
   const [command, setCommand] = useState<string>("");
   const [response, setResponse] = useState<any>();
   const [loading, setLoading] = useState<boolean>(false);

   const handleClick = async () => {
      setLoading(true);
      setResponse(await executeCommandRequest({ command }));
      setLoading(false);
   };

   const commandPresets = ["java --version", "pwd"];

   return (
      <CardColumn>
         <ResponseDisplay response={response} />
         <Autocomplete
            fullWidth
            freeSolo
            options={commandPresets}
            value={command}
            onInputChange={(event: any, value: string) => {
               setCommand(value);
            }}
            renderInput={params => (
               <TextField
                  {...params}
                  label="System command"
                  variant="outlined"
                  fullWidth
                  onKeyDown={event => {
                     if (event.key === "Enter") {
                        handleClick();
                     }
                  }}
               />
            )}
         />
         <LoadingButton loading={loading} variant="outlined" onClick={handleClick}>
            Run
         </LoadingButton>
      </CardColumn>
   );
};

export default RunCommandForm;
