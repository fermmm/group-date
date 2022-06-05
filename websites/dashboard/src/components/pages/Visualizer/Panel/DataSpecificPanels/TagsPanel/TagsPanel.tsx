import React, { FC } from "react";
import { Button } from "@mui/material";
import GenericPanel, { PropsGenericPropertiesTable, QueryButtonProps } from "../GenericPanel/GenericPanel";
import { Label } from "../GenericPanel/styles.GenericPanel";
import { Tag } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/tags";
import { decodeString } from "../../../../../../api/tools/shared-tools/utility-functions/decodeString";

const TagsPanel: FC<PropsGenericPropertiesTable> = props => {
   const tag = props.properties as unknown as Partial<Tag>;

   const tagQuery = `has("tagId", "${tag.tagId}")`;
   const queryButtons = [
      {
         name: "Subscribers",
         query: `g.V().union(${tagQuery}, ${tagQuery}.both("subscribed").hasLabel("user"))`,
      },
      {
         name: "Blockers",
         query: `g.V().union(${tagQuery}, ${tagQuery}.both("blocked").hasLabel("user"))`,
      },
   ];

   const dangerousQueryButtons: QueryButtonProps[] = [];

   return (
      <>
         <Label>{decodeString(tag.name)}</Label>
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

export default TagsPanel;
