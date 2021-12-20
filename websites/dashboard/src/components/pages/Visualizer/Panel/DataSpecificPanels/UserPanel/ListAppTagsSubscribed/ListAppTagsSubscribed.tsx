import React, { FC, useEffect, useState } from "react";
import { Chip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { visualizerGet } from "../../../../../../../api/server/visualizer";
import Prop from "../../GenericPanel/Prop/Prop";
import { TagListContainer } from "./styles.ListAppTagsSubscribed";

interface PropsListAppTagsSubscribed {
   userId: string;
}

const ListAppTagsSubscribed: FC<PropsListAppTagsSubscribed> = ({ userId }) => {
   const [isLoading, setIsLoading] = useState(false);
   const [tagList, setTagList] = useState<string[]>(null);
   const query = `g.V().has("userId", "${userId}").both("subscribed").hasLabel("tag").has("global", true)`;

   useEffect(() => {
      (async () => {
         if (isLoading || tagList) {
            return;
         }

         setIsLoading(true);
         const response = await visualizerGet({ query });
         setTagList(response?.map(({ properties }) => properties.name as string) ?? []);
         setIsLoading(false);
      })();
   }, [isLoading, tagList]);

   if (isLoading || !tagList) {
      return <CircularProgress color="secondary" />;
   }

   return (
      <>
         <Prop propName={"App tags subscribed"} />
         <TagListContainer>
            {tagList.map((tagName, i) => (
               <Chip label={tagName} color="primary" variant="outlined" key={i} />
            ))}
         </TagListContainer>
      </>
   );
};

export default ListAppTagsSubscribed;
