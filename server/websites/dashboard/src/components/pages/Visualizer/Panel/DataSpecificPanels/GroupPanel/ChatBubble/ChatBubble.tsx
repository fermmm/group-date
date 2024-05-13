import React, { FC } from "react";
import { ChatBubbleContainer, NameLabel, TextLabel } from "./styles.ChatBubble";

interface PropsChatBubble {
   name: string;
   text: string;
   color: string;
}

const ChatBubble: FC<PropsChatBubble> = props => {
   const { color, text, name } = props;

   return (
      <ChatBubbleContainer color={color}>
         <NameLabel>{name}</NameLabel>
         <TextLabel>{text}</TextLabel>
      </ChatBubbleContainer>
   );
};

export default ChatBubble;
