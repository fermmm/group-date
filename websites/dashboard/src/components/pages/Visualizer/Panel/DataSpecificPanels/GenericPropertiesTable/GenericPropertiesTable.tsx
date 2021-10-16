import React, { FC } from "react";
import {
   humanizeSecondsAmount,
   humanizeUnixTimeStamp
} from "../../../../../../common-tools/strings/humanizeUnixTime";
import { OnSearchFunc } from "../../../Visualizer";
import { KeyLabel, PropertiesContainer, ValueLabel } from "./styles.GenericPropertiesTable";

export interface PropsGenericPropertiesTable {
   id: string | number;
   properties: Record<string, string | number | boolean>;
   hideProps?: string[];
   onSearch: OnSearchFunc;
}

const GenericPropertiesTable: FC<PropsGenericPropertiesTable> = props => {
   const { properties, hideProps } = props;

   const keys = Object.keys(properties ?? {}).sort();

   const unixTimeProps = [
      "lastGroupJoinedDate",
      "birthDate",
      "lastLoginDate",
      "creationDate",
      "mostVotedDate",
      "lastInteractionDate",
      "timestamp"
   ];

   const setupValueText = (key: string, value: string | number | boolean) => {
      if (unixTimeProps.includes(key)) {
         return humanizeUnixTimeStamp(Number(value));
      }

      return String(value);
   };

   return (
      <>
         {keys.map(
            key =>
               (!hideProps || !hideProps.includes(key)) && (
                  <div key={key}>
                     <KeyLabel>{key}</KeyLabel>
                     <ValueLabel>{setupValueText(key, properties[key])}</ValueLabel>
                  </div>
               )
         )}
      </>
   );
};

export default GenericPropertiesTable;
