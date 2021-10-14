import React, { FC, useEffect, useState } from "react";
import { Button } from "@mui/material";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "../GenericPropertiesTable/GenericPropertiesTable";
import { ValueLabel } from "../GenericPropertiesTable/styles.GenericPropertiesTable";
import {
   Group,
   GroupChat
} from "../../../../../../api/tools/shared-tools/endpoints-interfaces/groups";
import { useTheme } from "styled-components";
import ChatBubble from "./ChatBubble/ChatBubble";
import { visualizerGet } from "../../../../../../api/server/visualizer";

const GroupPanel: FC<PropsGenericPropertiesTable> = props => {
   const group = (props.properties as unknown) as Partial<Group>;
   const theme = useTheme();
   const chat: GroupChat = JSON.parse(((group.chat ?? "[]") as unknown) as string);
   const [members, setMembers] = useState<Array<{ userId: string; name: string }>>();

   /**
    * Effect to get members of the group
    */
   useEffect(() => {
      (async () => {
         const result = await visualizerGet({
            query: `g.V().has("group", "groupId", "${group.groupId}").both("member")`
         });

         setMembers(
            result?.map(memberVertex => ({
               userId: memberVertex?.properties?.userId,
               name: memberVertex?.properties?.name
            })) ?? undefined
         );
      })();
   }, []);

   const groupQuery = `has("groupId", "${group.groupId}")`;
   const queryButtons = [
      {
         name: "Members",
         query: `g.V().union(${groupQuery}, ${groupQuery}.both("member"))`
      }
   ];

   const getColorForUser = (userId: string) => {
      if (members) {
         const memberIndex = members?.findIndex(m => m.userId === userId);
         return theme.colors.chatNamesColors[memberIndex] ?? "black";
      } else {
         return "black";
      }
   };

   return (
      <>
         <ValueLabel>{group.name}</ValueLabel>
         {queryButtons.map(buttonData => (
            <Button
               variant="outlined"
               color="secondary"
               onClick={() => props.onSearch(buttonData.query)}
            >
               {buttonData.name}
            </Button>
         ))}
         {chat.messages.map(message => (
            <ChatBubble
               name={
                  !members
                     ? message.authorUserId
                     : members.find(member => member.userId === message.authorUserId).name ??
                       message.authorUserId
               }
               text={message.messageText}
               color={getColorForUser(message.authorUserId)}
            />
         ))}
         <GenericPropertiesTable
            properties={group as Record<string, string | number>}
            onSearch={props.onSearch}
            hideProps={["chat"]}
         />
      </>
   );
};

export default GroupPanel;
