import React, { FC } from "react";
import { Button } from "@mui/material";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable,
   QueryButtonProps
} from "../GenericPropertiesTable/GenericPropertiesTable";
import { ValueLabel } from "../GenericPropertiesTable/styles.GenericPropertiesTable";

const EdgePanel: FC<PropsGenericPropertiesTable> = props => {
   const { properties, id } = props;

   const queryButtons: QueryButtonProps[] = [];
   const dangerousQueryButtons: QueryButtonProps[] = [];

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
         <GenericPropertiesTable {...props} hideProps={["images"]} />
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
