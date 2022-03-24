import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { Autocomplete, TextField } from "@mui/material";
import { runCodeRequest } from "../../../../api/server/techOps";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";
import { RowCentered } from "../../../common/UI/Row/Row";

const RunCodeForm: FC = props => {
   const [code, setCode] = useState<string>("");
   const [response, setResponse] = useState<any>();
   const [loading, setLoading] = useState<boolean>(false);

   const handleClick = async () => {
      setLoading(true);
      setResponse((await runCodeRequest({ code })).response);
      setLoading(false);
   };

   const commandPresets = [`"hello world"`, `await myFunc()`];

   return (
      <CardColumn>
         <ResponseDisplay response={response} />
         Runs JS code on server. Single line support. Import required functions in runCodeFromString.ts
         <RowCentered>
            <Autocomplete
               fullWidth
               freeSolo
               options={commandPresets}
               value={code}
               onInputChange={(event: any, value: string) => {
                  setCode(value);
               }}
               renderInput={params => (
                  <TextField
                     {...params}
                     label="JS line"
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
         </RowCentered>
      </CardColumn>
   );
};

export default RunCodeForm;
