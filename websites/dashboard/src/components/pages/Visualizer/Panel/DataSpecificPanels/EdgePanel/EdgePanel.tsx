import React, { FC } from "react";
import { Button } from "@mui/material";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "../GenericPropertiesTable/GenericPropertiesTable";
import { ValueLabel } from "../GenericPropertiesTable/styles.GenericPropertiesTable";

const EdgePanel: FC<PropsGenericPropertiesTable> = props => {
   const { properties, id } = props;

   const edgeQuery = `g.E("${id}")`;
   const queryButtons: Array<{ name: string; query: string }> = [];

   const dangerousQueryButtons = [
      {
         name: "Delete",
         query: `${edgeQuery}.drop()`
      }
   ];

   return (
      <>
         <ValueLabel>{properties.name}</ValueLabel>
         {queryButtons.map(buttonData => (
            <Button
               variant="outlined"
               color="secondary"
               onClick={() => props.onSearch({ query: buttonData.query })}
            >
               {buttonData.name}
            </Button>
         ))}
         <GenericPropertiesTable
            id={id}
            properties={properties as Record<string, string | number>}
            onSearch={props.onSearch}
            hideProps={["images"]}
         />
         {dangerousQueryButtons.map(buttonData => (
            <Button
               variant="outlined"
               color="error"
               onClick={() => props.onSearch({ query: buttonData.query })}
            >
               {buttonData.name}
            </Button>
         ))}
      </>
   );
};

export default EdgePanel;
