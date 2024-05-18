import React, { FC, useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";
import { JsonTextContainer } from "./styles.JsonText";

interface PropsJsonText {
   jsonText: string;
   className?: string;
   style?: React.CSSProperties;
}

const JsonText: FC<PropsJsonText> = props => {
   const { jsonText, className, style } = props;

   useEffect(() => {
      hljs.highlightAll();
   }, []);

   return (
      <JsonTextContainer className={className} style={style}>
         <code className="language-json" style={{ borderRadius: 10 }}>
            {jsonText}
         </code>
      </JsonTextContainer>
   );
};

export default JsonText;
