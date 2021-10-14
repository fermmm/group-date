import React, { FC } from "react";
import { KeyLabel, PropertiesContainer, ValueLabel } from "./styles.GenericPropertiesTable";

export interface PropsGenericPropertiesTable {
   properties: Record<string, string | number>;
   hideProps?: string[];
   onSearch: (query: string, nodeLimit?: number, reset?: boolean) => void;
}

const GenericPropertiesTable: FC<PropsGenericPropertiesTable> = props => {
   const { properties, hideProps } = props;

   const keys = Object.keys(properties ?? {}).sort();

   return (
      <>
         {keys.map(
            key =>
               (!hideProps || !hideProps.includes(key)) && (
                  <div key={key}>
                     <KeyLabel>{key}</KeyLabel>
                     <ValueLabel>{String(properties[key])}</ValueLabel>
                  </div>
               )
         )}
      </>
   );
};

export default GenericPropertiesTable;
