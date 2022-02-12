import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import { databaseQueryRequest } from "../../../../api/server/techOps";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";
import { AdminQueryResponse } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";

const SendQueryForm: FC = props => {
   const [query, setQuery] = useState<string>("g.V().limit(3)");
   const [response, setResponse] = useState<AdminQueryResponse>();
   const [error, setError] = useState<string>();
   const [loading, setLoading] = useState<boolean>(false);

   const handleClick = async () => {
      setLoading(true);
      try {
         setResponse(await databaseQueryRequest({ query }));
      } catch (error) {
         setResponse(undefined);
         setError(tryToGetErrorMessage(error));
      }
      setLoading(false);
   };

   return (
      <CardColumn>
         <ResponseDisplay response={response?._items ?? error} />
         <TextField
            label="Gremlin Query"
            variant="outlined"
            multiline
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
         />
         <LoadingButton loading={loading} variant="outlined" onClick={handleClick}>
            Send query
         </LoadingButton>
      </CardColumn>
   );
};

export default SendQueryForm;
