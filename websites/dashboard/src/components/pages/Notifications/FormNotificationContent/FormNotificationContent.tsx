import { Autocomplete, TextField } from "@mui/material";
import React, { FC, useEffect, useState } from "react";
import {
   NotificationContent,
   NotificationType
} from "../../../../api/tools/shared-tools/endpoints-interfaces/user";
import { FormContainer } from "../common/containers";

export interface PropsNotificationContent {
   onChange: (notificationContent: NotificationContent) => void;
}

const FormNotificationContent: FC<PropsNotificationContent> = props => {
   const [title, setTitle] = useState<string>();
   const [text, setText] = useState<string>();
   const [targetId, setTargetId] = useState<string>();
   const [type, setType] = useState<NotificationType>(NotificationType.TextOnly);

   const notificationTypesAllowed = [
      NotificationType.NearbyPartyOrEvent,
      NotificationType.TextOnly
   ];

   useEffect(() => {
      props.onChange({ title, text, type, idForReplacement: `${title}${text}${type}` });
   }, [title, text, type]);

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
            value={text}
            onChange={e => setText(e.target.value)}
         />
         If the notification should open a webpage when clicked paste the link here. This only works
         for NearbyPartyOrEvent notification type
         <TextField
            label="Link"
            variant="outlined"
            fullWidth
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
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
            renderInput={params => (
               <TextField {...params} label="Notification type" variant="outlined" />
            )}
         />
      </FormContainer>
   );
};

export default FormNotificationContent;
