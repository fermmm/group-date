import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import React, { FC, useState } from "react";
import { sendEmailRequest } from "../../../../api/server/techOps";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";

const SendEmailForm: FC = props => {
   const [email, setEmail] = useState<string>("");
   const [response, setResponse] = useState<any>();
   const [loading, setLoading] = useState<boolean>(false);

   const handleClick = async () => {
      setLoading(true);
      setResponse(
         await sendEmailRequest({
            to: email,
            subject: "Testing email sender",
            text: "This is a test email that showing the email sender works",
         }),
      );
      setLoading(false);
   };

   return (
      <CardColumn>
         <ResponseDisplay response={response} />
         <TextField
            label="Email"
            variant="outlined"
            multiline
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
         />
         <LoadingButton loading={loading} variant="outlined" onClick={handleClick}>
            Send test email
         </LoadingButton>
      </CardColumn>
   );
};

export default SendEmailForm;
