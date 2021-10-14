import React, { FC } from "react";
import { Button } from "@mui/material";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "../GenericPropertiesTable/GenericPropertiesTable";
import { ValueLabel } from "../GenericPropertiesTable/styles.GenericPropertiesTable";
import { Tag } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/tags";

const TagsPanel: FC<PropsGenericPropertiesTable> = props => {
   const tag = (props.properties as unknown) as Partial<Tag>;

   const tagQuery = `has("tagId", "${tag.tagId}")`;
   const queryButtons = [
      {
         name: "Subscribers",
         query: `g.V().union(${tagQuery}, ${tagQuery}.both("subscribed").hasLabel("user"))`
      },
      {
         name: "Blockers",
         query: `g.V().union(${tagQuery}, ${tagQuery}.both("blocked").hasLabel("user"))`
      }
   ];

   const dangerousQueryButtons = [
      {
         name: "Delete tag",
         query: `g.V().${tagQuery}.drop()`
      }
   ];

   return (
      <>
         <ValueLabel>{tag.name}</ValueLabel>
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
            properties={tag as Record<string, string | number>}
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

export default TagsPanel;
