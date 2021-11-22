import React, { FC, useState } from "react";
import { Button } from "@mui/material";
import { useServerInfo } from "../../../../../../api/server/server-info";
import { User } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/user";
import GenericPanel, { PropsGenericPropertiesTable, QueryButtonProps } from "../GenericPanel/GenericPanel";
import { Label } from "../GenericPanel/styles.GenericPanel";
import { Row } from "../../../../../common/UI/Row/Row";
import ImagesCarousel from "../../../../../common/UI/ImagesCarousel/ImagesCarousel";
import { getCountryName } from "../../../../../../common-tools/strings/humanizeCountryCode";
import BanUserDialog from "./BanUserDialog/BanUserDialog";
import { UserBanReason } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import {
   banUserRequest,
   removeAllBansFromUserRequest,
   removeBanFromUserRequest,
} from "../../../../../../api/server/admin";
import RemoveBanFromUserDialog from "./RemoveBanFromUserDialog/RemoveBanFromUserDialog";
import ConfirmationDialog from "../../../../../common/UI/ConfirmationDialog/ConfirmationDialog";
import { openQueryInNewTab } from "../../../tools/openQueryInNewTab";

const UserPanel: FC<PropsGenericPropertiesTable> = props => {
   const user = props.properties as unknown as Partial<User>;
   const serverInfo = useServerInfo();
   const [banUserDialogOpen, setBanUserDialogOpen] = useState(false);
   const [removeBanDialogOpen, setRemoveBanDialogOpen] = useState(false);
   const [removeAllBansDialogOpen, setRemoveAllBansDialogOpen] = useState(false);

   const userQuery = `has("userId", "${user.userId}")`;

   /**
    * enableMiddleClick opens the query in a new tab when doing middle click on the button
    */
   const queryButtons = [
      {
         name: "Tags",
         query: `g.V().union(${userQuery}, ${userQuery}.both("subscribed", "blocked").hasLabel("tag"))`,
         enableMiddleClick: true,
      },
      {
         name: "Likes Dislikes",
         query: `g.V().union(${userQuery}, ${userQuery}.both("Like", "Dislike"))`,
         enableMiddleClick: true,
      },
      {
         name: "Matches",
         query: `g.V().union(${userQuery}, ${userQuery}.both("Match"))`,
         enableMiddleClick: true,
      },
      {
         name: "Groups",
         query: `g.V().union(${userQuery}, ${userQuery}.both().hasLabel("group"))`,
         enableMiddleClick: true,
      },
      {
         name: "Genders",
         query: `g.V().union(${userQuery}, ${userQuery}.both("isGender", "likesGender"))`,
         enableMiddleClick: true,
      },
   ];

   // openQueryInNewTab(`g.V(${elementToShow.id})`);

   const dangerousQueryButtons: QueryButtonProps[] = [];

   const handleBanUser = async (reason: UserBanReason) => {
      if (reason == null) {
         return;
      }

      await banUserRequest({ reason, userId: user.userId });
      props.onRefresh();
   };

   const handleRemoveBan = async (reason: UserBanReason) => {
      if (reason == null) {
         return;
      }

      await removeBanFromUserRequest({ reason, userId: user.userId });
      props.onRefresh();
   };

   const handleRemoveAllBans = async () => {
      await removeAllBansFromUserRequest({ userId: user.userId });
      props.onRefresh();
   };

   return (
      <>
         <Row>
            <Label>{user.name}</Label>
            <Label>
               {/*https://flagpedia.net/download/api*/}
               <img
                  src={`https://flagcdn.com/20x15/${user.country?.toLocaleLowerCase()}.png`}
                  width="20"
                  height="15"
               />{" "}
               {getCountryName(user.country)}
            </Label>
         </Row>
         {user.profileDescription && <Label>{user.profileDescription}</Label>}
         <Label>Idea: {user.dateIdea}</Label>
         {user.images && serverInfo?.data?.imagesHost && (
            <ImagesCarousel>
               {(JSON.parse(user.images as unknown as string) as string[])?.map(image => (
                  <img src={serverInfo?.data?.imagesHost + image} key={image} />
               ))}
            </ImagesCarousel>
         )}
         {queryButtons.map((buttonData, i) => (
            <Button
               variant="outlined"
               color="secondary"
               onClick={() => props.onSearch({ query: buttonData.query })}
               onMouseDown={e => {
                  if (e.button === 1 && buttonData.enableMiddleClick) {
                     // This doesn't work
                     e.preventDefault();
                     openQueryInNewTab(buttonData.query);
                  }
               }}
               key={i}
            >
               {buttonData.name}
            </Button>
         ))}
         <Button variant="outlined" color="secondary" onClick={() => setBanUserDialogOpen(true)}>
            Ban user
         </Button>
         <Button variant="outlined" color="secondary" onClick={() => setRemoveBanDialogOpen(true)}>
            Remove ban from user
         </Button>
         <Button variant="outlined" color="secondary" onClick={() => setRemoveAllBansDialogOpen(true)}>
            Remove all bans from user
         </Button>
         <GenericPanel {...props} hideProps={["images"]} />
         {dangerousQueryButtons.map((buttonData, i) => (
            <Button
               variant="outlined"
               color="error"
               onClick={() => props.onSearch({ query: buttonData.query })}
               key={i}
            >
               {buttonData.name}
            </Button>
         ))}
         <BanUserDialog
            open={banUserDialogOpen}
            onClose={() => setBanUserDialogOpen(false)}
            onContinueClick={handleBanUser}
         />
         <RemoveBanFromUserDialog
            open={removeBanDialogOpen}
            user={user}
            onClose={() => setRemoveBanDialogOpen(false)}
            onContinueClick={handleRemoveBan}
         />
         <ConfirmationDialog
            title="Confirm"
            text="Remove all bans from user?"
            continueButtonText="Remove all bans"
            open={removeAllBansDialogOpen}
            onClose={() => setRemoveAllBansDialogOpen(false)}
            onContinueClick={handleRemoveAllBans}
         />
      </>
   );
};

export default UserPanel;
