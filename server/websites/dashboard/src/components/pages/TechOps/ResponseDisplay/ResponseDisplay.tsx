import React, { FC } from "react";
import { JsonTextContainer, ResponseLine, ResponseTextContainer } from "./styles.ResponseDisplay";

interface PropsResponseDisplay {
   response: any;
}

const ResponseDisplay: FC<PropsResponseDisplay> = ({ response }) => {
   if (!response) {
      return null;
   }

   let responseText: string;
   if (typeof response === "string") {
      responseText = response;
   } else {
      try {
         responseText = JSON.stringify(response, null, 3);
      } catch (e) {
         responseText = response;
      }
   }

   const addLineBreaks = (string: string) => {
      const result = string
         .replaceAll("\\n", "\n")
         .split(/\r\n|\r|\n/g)
         .map((text, index) => <ResponseLine key={`${text}-${index}`}>{text}</ResponseLine>);
      return result;
   };

   return (
      <ResponseTextContainer>
         <h3>Response received</h3>
         <JsonTextContainer>{addLineBreaks(responseText)}</JsonTextContainer>
      </ResponseTextContainer>
   );
};

export default ResponseDisplay;
