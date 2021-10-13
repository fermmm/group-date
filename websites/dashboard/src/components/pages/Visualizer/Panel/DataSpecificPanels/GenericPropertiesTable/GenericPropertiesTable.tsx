import React, { FC } from "react";
import { KeyLabel, PropertiesContainer, ValueLabel } from "./styles.GenericPropertiesTable";

export interface PropsGenericPropertiesTable {
   properties: Record<string, string | number>;
}

const GenericPropertiesTable: FC<PropsGenericPropertiesTable> = props => {
   const { properties } = props;

   const keys = Object.keys(properties ?? {}).sort();

   return (
      <>
         {keys.map(key => (
            <React.Fragment key={key}>
               <KeyLabel>{key}</KeyLabel>
               <ValueLabel>{String(properties[key])}</ValueLabel>
            </React.Fragment>
         ))}
      </>
   );
};

export default GenericPropertiesTable;
