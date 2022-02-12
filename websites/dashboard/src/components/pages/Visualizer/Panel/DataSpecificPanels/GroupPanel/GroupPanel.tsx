import React, { FC, useEffect, useState } from "react";
import { Button } from "@mui/material";
import GenericPanel, { PropsGenericPropertiesTable } from "../GenericPanel/GenericPanel";
import { Label } from "../GenericPanel/styles.GenericPanel";
import { Group, GroupChat } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/groups";
import { useTheme } from "styled-components";
import ChatBubble from "./ChatBubble/ChatBubble";
import { openQueryInNewTab } from "../../../tools/openQueryInNewTab";
import { databaseQueryRequest } from "../../../../../../api/server/techOps";

const GroupPanel: FC<PropsGenericPropertiesTable> = props => {
   const group = props.properties as unknown as Partial<Group>;
   const theme = useTheme();
   const chat: GroupChat = JSON.parse((group.chat ?? "[]") as unknown as string);
   const [members, setMembers] = useState<Array<{ userId: string; name: string }>>();

   /**
    * Effect to get members of the group
    */
   useEffect(() => {
      (async () => {
         const query = `g.V().has("group", "groupId", "${group.groupId}").both("member").map(values("name", "userId").fold())`;
         const result = (await databaseQueryRequest<[userId: string, name: string]>({ query }))._items;

         setMembers(
            result?.map(([userId, name]) => ({
               userId,
               name,
            })) ?? undefined,
         );
      })();
   }, []);

   const groupQuery = `has("groupId", "${group.groupId}")`;
   const queryButtons = [
      {
         name: "Members",
         query: `g.V().union(${groupQuery}, ${groupQuery}.both("member"))`,
         enableMiddleClick: true,
      },
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
         <Label>{group.name}</Label>
         {queryButtons.map(buttonData => (
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
            >
               {buttonData.name}
            </Button>
         ))}
         {chat.messages.map(message => (
            <ChatBubble
               name={
                  !members
                     ? message.authorUserId
                     : members?.find(member => member.userId === message.authorUserId)?.name ??
                       message.authorUserId
               }
               text={message.messageText}
               color={getColorForUser(message.authorUserId)}
            />
         ))}
         <GenericPanel {...props} hideProps={["chat"]} />
      </>
   );
};

export default GroupPanel;
