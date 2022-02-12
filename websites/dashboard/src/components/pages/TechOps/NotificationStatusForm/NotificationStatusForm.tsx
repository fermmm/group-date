import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import React, { FC, useState } from "react";
import { notificationStatusRequest } from "../../../../api/server/techOps";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";

const NotificationStatusForm: FC = props => {
   const [ticketId, setTicketId] = useState<string>("");
   const [response, setResponse] = useState<any>();
   const [loading, setLoading] = useState<boolean>(false);

   const handleClick = async () => {
      setLoading(true);
      setResponse(await notificationStatusRequest({ ticketId }));
      setLoading(false);
   };

   return (
      <CardColumn>
         <ResponseDisplay response={response} />
         <TextField
            label="Notification ticket id"
            variant="outlined"
            multiline
            fullWidth
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
         />
         <LoadingButton loading={loading} variant="outlined" onClick={handleClick}>
            Get notification status
         </LoadingButton>
      </CardColumn>
   );
};

export default NotificationStatusForm;
