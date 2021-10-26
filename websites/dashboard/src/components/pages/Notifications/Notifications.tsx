import LoadingButton from "@mui/lab/LoadingButton";
import React, { FC, useState } from "react";
import { sendNotificationsPost } from "../../../api/server/notifications-send";
import {
   AdminNotificationFilter,
   AdminNotificationPostParams,
} from "../../../api/tools/shared-tools/endpoints-interfaces/admin";
import {
   NotificationChannelId,
   NotificationContent,
   NotificationType,
} from "../../../api/tools/shared-tools/endpoints-interfaces/user";
import { tryToGetErrorMessage } from "../../../api/tools/tryToGetErrorMessage";
import DashboardPageContainer from "../../common/DashboardPageContainer/DashboardPageContainer";
import CardColumn from "../../common/UI/CardColumn/CardColumn";
import ConfirmationDialog from "../../common/UI/ConfirmationDialog/ConfirmationDialog";
import FormEmailSelector from "./FormEmailSelector/FormEmailSelector";
import FormNotificationContent from "./FormNotificationContent/FormNotificationContent";
import { ContinueButtonContainer } from "./styles.Notifications";

const Notifications: FC = () => {
   const [notificationContent, setNotificationContent] = useState<NotificationContent>();
   const [emailFilter, setEmailFilter] = useState<string[]>();
   const [loading, setLoading] = useState<boolean>(false);
   const [response, setResponse] = useState<string>();
   const [error, setError] = useState<string>();
   const [confirmResponse, setConfirmResponse] = useState<string>();
   const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

   const handleSend = async (onlyReturnUsersAmount: boolean) => {
      setError(null);
      setResponse(null);

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
               : NotificationChannelId.Default,
      };

      if (
         requestParams?.notificationContent?.text == null ||
         requestParams?.notificationContent?.text.length < 2
      ) {
         setError("You need to set the notification text");
         return;
      }

      if (
         requestParams?.notificationContent?.title == null ||
         requestParams?.notificationContent?.title.length < 2
      ) {
         setError("You need to set the notification title");
         return;
      }

      setLoading(true);
      try {
         const response = await sendNotificationsPost(requestParams);

         if (onlyReturnUsersAmount) {
            setConfirmResponse(response);
            setConfirmDialogOpen(true);
         } else {
            setResponse(response);
         }
      } catch (error) {
         setResponse(tryToGetErrorMessage(response));
      }
      setLoading(false);
   };

   return (
      <DashboardPageContainer>
         <h1>Send Notification</h1>
         <CardColumn>
            <h3>Notification content</h3>
            <FormNotificationContent onChange={setNotificationContent} />
            <h3>Select target users</h3>
            <FormEmailSelector onChange={setEmailFilter} />
            {error && (
               <div>
                  <h3>Error</h3>
                  <div>{error}</div>
               </div>
            )}
            {response && (
               <div>
                  <h3>Response received</h3>
                  <div dangerouslySetInnerHTML={{ __html: response }} />
               </div>
            )}
            <ContinueButtonContainer>
               <LoadingButton
                  loading={loading}
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleSend(true)}
               >
                  Continue
               </LoadingButton>
            </ContinueButtonContainer>
            <ConfirmationDialog
               open={confirmDialogOpen}
               text={confirmResponse}
               onContinueClick={() => handleSend(false)}
               onClose={() => setConfirmDialogOpen(false)}
               continueButtonText={"Send notification!"}
               cancelButtonText={"Cancel"}
            />
         </CardColumn>
      </DashboardPageContainer>
   );
};

export default Notifications;
