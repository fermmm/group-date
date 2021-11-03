import React, { FC } from "react";
import { JsonTextContainer, ResponseTextContainer } from "./styles.ResponseDisplay";

interface PropsResponseDisplay {
   response: any;
}

const ResponseDisplay: FC<PropsResponseDisplay> = ({ response }) => {
   if (response) {
      let responseText: string;
      try {
         responseText = JSON.stringify(response, null, 3);
      } catch (e) {
         responseText = response;
      }

      return (
         <ResponseTextContainer>
            <h3>Response received</h3>
            <JsonTextContainer dangerouslySetInnerHTML={{ __html: responseText }} />
         </ResponseTextContainer>
      );
   }

   return null;
};

export default ResponseDisplay;
