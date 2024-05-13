import React, { FC, useEffect, useState } from "react";
import { Chip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { TagListContainer } from "./styles.ListAppTagsSubscribed";
import { tagsGetRequest } from "../../../../../../../api/server/tags";
import { userGetRequest } from "../../../../../../../api/server/user";
import { decodeString } from "../../../../../../../api/tools/shared-tools/utility-functions/decodeString";
import { getGlobalSettingValue } from "../../../../../../../common-tools/settings/global-settings";

interface PropsListAppTagsSubscribed {
   token: string;
}

const ListAppTagsSubscribed: FC<PropsListAppTagsSubscribed> = ({ token }) => {
   const [isLoading, setIsLoading] = useState(false);
   const [tagList, setTagList] = useState<string[]>(null);
   const showDecoded = getGlobalSettingValue<boolean>("showDecoded");

   useEffect(() => {
      (async () => {
         if (isLoading || tagList) {
            return;
         }

         setIsLoading(true);
         const tags = await tagsGetRequest({ token });
         const globalTagsIds = tags?.filter(tag => tag.global).map(tag => tag.tagId) ?? [];

         const user = await userGetRequest({ token });
         const globalTagNames = user?.tagsSubscribed
            ?.filter(tag => globalTagsIds.includes(tag.tagId))
            .map(tag => tag.name);
         setTagList(globalTagNames ?? []);
         setIsLoading(false);
      })();
   }, [isLoading, tagList, token]);

   useEffect(() => {
      setTagList(null);
   }, [token]);

   if (isLoading || !tagList) {
      return <CircularProgress color="secondary" />;
   }

   return (
      <>
         <TagListContainer>
            {tagList.map((tagName, i) => (
               <Chip
                  label={showDecoded ? decodeString(tagName) : tagName}
                  color="primary"
                  variant="outlined"
                  key={i}
               />
            ))}
         </TagListContainer>
      </>
   );
};

export default ListAppTagsSubscribed;
