import React, { FC } from "react";
import { JsonTextContainer, ResponseTextContainer } from "./styles.ResponseText";

interface PropsResponseText {
   responseText: string;
}

const ResponseText: FC<PropsResponseText> = ({ responseText }) => {
   if (responseText) {
      return (
         <ResponseTextContainer>
            <h3>Response received</h3>
            <JsonTextContainer dangerouslySetInnerHTML={{ __html: responseText }} />
         </ResponseTextContainer>
      );
   }

   return null;
};

export default ResponseText;
