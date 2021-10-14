import React, { FC } from "react";
import { Button } from "@mui/material";
import { useServerInfo } from "../../../../../../api/server/server-info";
import { User } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/user";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "../GenericPropertiesTable/GenericPropertiesTable";
import { ValueLabel } from "../GenericPropertiesTable/styles.GenericPropertiesTable";

const UserPanel: FC<PropsGenericPropertiesTable> = props => {
   const user = (props.properties as unknown) as Partial<User>;
   const serverInfo = useServerInfo();

   const userQuery = `has("userId", "${user.userId}")`;
   const queryButtons = [
      {
         name: "Genders",
         query: `g.V().union(${userQuery}, ${userQuery}.both("isGender", "likesGender"))`
      },
      {
         name: "Matches",
         query: `g.V().union(${userQuery}, ${userQuery}.both("Match"))`
      },
      {
         name: "Likes Dislikes",
         query: `g.V().union(${userQuery}, ${userQuery}.both("Like", "Dislike"))`
      },
      {
         name: "Tags",
         query: `g.V().union(${userQuery}, ${userQuery}.both("subscribed", "blocked").hasLabel("tag"))`
      },
      {
         name: "Groups",
         query: `g.V().union(${userQuery}, ${userQuery}.both().hasLabel("group"))`
      }
   ];

   const dangerousQueryButtons = [
      {
         name: "Delete user",
         query: `g.V().${userQuery}.drop()`
      }
   ];

   return (
      <>
         <ValueLabel>{user.name}</ValueLabel>
         <ValueLabel>{user.country}</ValueLabel>
         <ValueLabel>{user.profileDescription}</ValueLabel>
         <ValueLabel>{user.dateIdea}</ValueLabel>
         {queryButtons.map((buttonData, i) => (
            <Button
               variant="outlined"
               color="secondary"
               onClick={() => props.onSearch({ query: buttonData.query })}
               key={i}
            >
               {buttonData.name}
            </Button>
         ))}
         {user.images &&
            serverInfo?.data?.imagesHost &&
            (JSON.parse((user.images as unknown) as string) as string[]).map(image => (
               <img src={serverInfo?.data?.imagesHost + image} />
            ))}

         <GenericPropertiesTable
            properties={user as Record<string, string | number>}
            onSearch={props.onSearch}
            hideProps={["images"]}
         />
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
      </>
   );
};

export default UserPanel;
