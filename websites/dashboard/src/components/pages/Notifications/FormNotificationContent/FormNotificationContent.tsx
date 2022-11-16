import { Autocomplete, Checkbox, FormControlLabel, TextField } from "@mui/material";
import React, { ChangeEvent, FC, useEffect, useState } from "react";
import {
   NotificationContent,
   NotificationType,
} from "../../../../api/tools/shared-tools/endpoints-interfaces/user";
import { FormContainer } from "../common/containers";

export interface PropsNotificationContent {
   onChange: (notificationContent: NotificationContent, options: NotificationSendingOptions) => void;
}

export interface NotificationSendingOptions {
   sendEmail: boolean;
   sendPush: boolean;
}

const FormNotificationContent: FC<PropsNotificationContent> = props => {
   const [title, setTitle] = useState<string>();
   const [text, setText] = useState<string>(
      `<pre style="text-align: justify;">

Use this example pre tag for large texts on email notifications, for push or small texts don't use html, remove all this and just write the text

</pre>`,
   );
   const [sendEmail, setSendEmail] = useState<boolean>(false);
   const [sendPush, setSendPush] = useState<boolean>(false);
   const [targetId, setTargetId] = useState<string>();
   const [type, setType] = useState<NotificationType>(NotificationType.TextOnly);

   const notificationTypesAllowed = [NotificationType.NearbyPartyOrEvent, NotificationType.TextOnly];

   useEffect(() => {
      props.onChange(
         { title, text, type, idForReplacement: `${title}${text}${type}` },
         { sendEmail, sendPush },
      );
   }, [title, text, type, sendEmail]);

   return (
      <FormContainer>
         <TextField
            label="Notification title"
            variant="outlined"
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
         />
         <TextField
            label="Notification text"
            variant="outlined"
            fullWidth
            multiline
            value={text}
            onChange={e => setText(e.target.value)}
         />
         Notification type
         <FormControlLabel
            label={"Email notification"}
            control={
               <Checkbox
                  checked={sendEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSendEmail(e.target.checked)}
                  inputProps={{ "aria-label": "controlled" }}
               />
            }
         />
         <FormControlLabel
            label={"Push notification"}
            control={
               <Checkbox
                  checked={sendPush}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSendPush(e.target.checked)}
                  inputProps={{ "aria-label": "controlled" }}
               />
            }
         />
         The notification type affects the icon and what happens when clicked
         <Autocomplete
            options={notificationTypesAllowed}
            value={type}
            onChange={(event: any, value: NotificationType | null | string) => {
               if (typeof value === typeof NotificationType.TextOnly) {
                  setType(Number(value ?? NotificationType.TextOnly));
               }
            }}
            getOptionLabel={(selected: NotificationType) => NotificationType[selected]}
            renderInput={params => <TextField {...params} label="Notification type" variant="outlined" />}
         />
         If the notification should open a webpage when clicked paste the link here. This only works for
         NearbyPartyOrEvent notification type
         <TextField
            label="Link"
            variant="outlined"
            fullWidth
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
         />
      </FormContainer>
   );
};

export default FormNotificationContent;
