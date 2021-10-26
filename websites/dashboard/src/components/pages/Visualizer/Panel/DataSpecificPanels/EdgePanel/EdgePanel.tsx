import React, { FC } from "react";
import { Button } from "@mui/material";
import GenericPanel, { PropsGenericPropertiesTable, QueryButtonProps } from "../GenericPanel/GenericPanel";
import { ValueLabel } from "../GenericPanel/styles.GenericPanel";

const EdgePanel: FC<PropsGenericPropertiesTable> = props => {
   const { properties, label } = props;

   const sameLabelEdges = `g.E().hasLabel("${label}")`;

   const queryButtons: QueryButtonProps[] = [
      {
         name: "All edges like this",
         query: `${sameLabelEdges}.bothV()`,
      },
   ];
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
         <GenericPanel {...props} hideProps={["images"]} />
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
