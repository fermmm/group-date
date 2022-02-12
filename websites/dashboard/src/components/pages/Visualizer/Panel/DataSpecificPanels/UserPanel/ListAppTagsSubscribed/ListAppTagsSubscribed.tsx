import React, { FC, useEffect, useState } from "react";
import { Chip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { TagListContainer } from "./styles.ListAppTagsSubscribed";
import { databaseQueryRequest } from "../../../../../../../api/server/techOps";

interface PropsListAppTagsSubscribed {
   userId: string;
}

const ListAppTagsSubscribed: FC<PropsListAppTagsSubscribed> = ({ userId }) => {
   const [isLoading, setIsLoading] = useState(false);
   const [tagList, setTagList] = useState<string[]>(null);
   const query = `g.V().has("userId", "${userId}").both("subscribed").hasLabel("tag").has("global", true).values("name")`;

   useEffect(() => {
      (async () => {
         if (isLoading || tagList) {
            return;
         }

         setIsLoading(true);
         const response = await databaseQueryRequest<string>({ query });
         setTagList(response?._items ?? []);
         setIsLoading(false);
      })();
   }, [isLoading, tagList, query]);

   useEffect(() => {
      setTagList(null);
   }, [query]);

   if (isLoading || !tagList) {
      return <CircularProgress color="secondary" />;
   }

   return (
      <>
         <TagListContainer>
            {tagList.map((tagName, i) => (
               <Chip label={tagName} color="primary" variant="outlined" key={i} />
            ))}
         </TagListContainer>
      </>
   );
};

export default ListAppTagsSubscribed;
