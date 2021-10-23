import LoadingButton from "@mui/lab/LoadingButton";
import { Card } from "@mui/material";
import React, { FC, useState } from "react";
import { sendNotificationsPost } from "../../../api/server/notifications-send";
import {
   AdminNotificationFilter,
   AdminNotificationPostParams
} from "../../../api/tools/shared-tools/endpoints-interfaces/admin";
import {
   NotificationChannelId,
   NotificationContent,
   NotificationType
} from "../../../api/tools/shared-tools/endpoints-interfaces/user";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import FormEmailSelector from "./FormEmailSelector/FormEmailSelector";
import FormNotificationContent from "./FormNotificationContent/FormNotificationContent";
import { CardContentStyled } from "./styles.Notifications";

// TODO: Validar que ponga text, title y notificationType
// TODO: Cuando envia la primera vez tiene que aparecer un popup y despues el envio real
const Notifications: FC = () => {
   const [notificationContent, setNotificationContent] = useState<NotificationContent>();
   const [emailFilter, setEmailFilter] = useState<string[]>();
   const [loading, setLoading] = useState<boolean>(false);
   const [response, setResponse] = useState<string>();
   const [confirmResponse, setConfirmResponse] = useState<string>();

   const handleSend = async (onlyReturnUsersAmount: boolean) => {
      const filters: AdminNotificationFilter = {};
      if (emailFilter != null && emailFilter.length > 0) {
         filters.usersEmail = emailFilter;
      }

      const requestParams: Partial<AdminNotificationPostParams> = {
         onlyReturnUsersAmount,
         filters,
         notificationContent,
         channelId:
            notificationContent?.type === NotificationType.NearbyPartyOrEvent
               ? NotificationChannelId.Events
               : NotificationChannelId.Default
      };

      setLoading(true);

      const response = await sendNotificationsPost(requestParams);

      if (onlyReturnUsersAmount) {
         setConfirmResponse(response);
      } else {
         setResponse(response);
      }

      setLoading(false);
   };

   return (
      <DashboardPageContainer>
         <h1>Send Notification</h1>
         <Card sx={{ minWidth: 275 }}>
            <CardContentStyled>
               <h3>Notification content</h3>
               <FormNotificationContent onChange={setNotificationContent} />
               <h3>Select target users</h3>
               <FormEmailSelector onChange={setEmailFilter} />
               <LoadingButton
                  loading={loading}
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleSend(true)}
               >
                  Continue
               </LoadingButton>
            </CardContentStyled>
         </Card>
      </DashboardPageContainer>
   );
};

export default Notifications;
