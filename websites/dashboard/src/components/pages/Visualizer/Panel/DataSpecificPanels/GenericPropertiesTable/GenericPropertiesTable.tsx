import Button from "@mui/material/Button";
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
   isVertex: boolean | undefined;
   hideProps?: string[];
   onSearch: OnSearchFunc;
}

export interface QueryButtonProps {
   name: string;
   query: string;
   visualize?: boolean;
}

const GenericPropertiesTable: FC<PropsGenericPropertiesTable> = props => {
   const { properties, hideProps, id, isVertex } = props;

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

   const elementSelectionQuery = isVertex
      ? `g.V(${typeof id === "string" ? `"${id}"` : id})`
      : `g.E(${typeof id === "string" ? `"${id}"` : id})`;

   const dangerousQueryButtons: QueryButtonProps[] = [
      {
         name: "Delete",
         query: `${elementSelectionQuery}.drop()`,
         visualize: false
      }
   ];

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
         {dangerousQueryButtons.map((buttonData, i) => (
            <Button
               variant="outlined"
               color="error"
               onClick={() =>
                  props.onSearch({ query: buttonData.query, visualize: buttonData.visualize })
               }
               key={i}
            >
               {buttonData.name}
            </Button>
         ))}
      </>
   );
};

export default GenericPropertiesTable;
