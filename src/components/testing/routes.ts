import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { g, sendQuery, __ } from "../../common-tools/database-tools/database-manager";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import {
   ALL_GENDERS,
   CIS_GENDERS,
   Gender,
   NON_CIS_GENDERS,
   TRANS_GENDERS,
} from "../../shared-tools/endpoints-interfaces/user";
import { removeBlockToTagsPost, removeSubscriptionToTagsPost } from "../tags/models";
import { createGenders, retrieveUser, userGet, userPost } from "../user/models";
import { queryToGetAllUsers } from "../user/queries";
import {
   createFakeChatConversation,
   createFakeTagsPost,
   createFakeUsersPost,
   forceGroupSearch,
} from "./models";

export function testingRoutes(r: Router): void {
   createRoute(r, "/testing/create-fake-users", "GET", createFakeUsersPost);
   createRoute(r, "/testing/create-fake-tags", "GET", createFakeTagsPost);
   createRoute(r, "/testing/force-groups-search", "GET", forceGroupSearch);
   createRoute(r, "/testing/create-fake-chat", "GET", createFakeChatConversation);

   createRoute(r, "/testing/temp", "GET", async (params: any, ctx: BaseContext) => {
      // To check in visualizer
      // g.V().union(has("name", "Diego y Mile"), has("name", "Diego y Mile").both().hasLabel("tag").has("category", "gender"), has("name", "Diego y Mile").both().hasLabel("gender"))

      await createGenders();

      const allUsers = await sendQuery(() =>
         queryToGetAllUsers().map(__.properties("token", "name").fold()).toList(),
      );
      const allUsersParsed = allUsers.map((props: Array<{ key: string; value: string }>) => ({
         [props[0]?.key]: props[0]?.value,
         [props[1]?.key]: props[1]?.value,
      }));
      const allTokens = allUsersParsed.map(user => user.token);
      const allNames = allUsersParsed.filter(user => user.name).map(user => user.name);

      for (const token of allTokens) {
         const user = await retrieveUser(token, true, ctx);

         const genderTagsSubscribed =
            (user.tagsSubscribed
               ?.filter(tag => ALL_GENDERS.includes(tag.tagId as Gender))
               ?.map(tag => tag.tagId) as Gender[]) ?? [];
         const genderTagsBlocked =
            (user.tagsBlocked
               ?.filter(tag => ALL_GENDERS.includes(tag.tagId as Gender))
               ?.map(tag => tag.tagId) as Gender[]) ?? [];

         if (genderTagsSubscribed.length > 0) {
            await userPost(
               {
                  token: user.token,
                  props: {
                     genders: genderTagsSubscribed,
                     likesGenders: ALL_GENDERS.filter(gender => !genderTagsBlocked.includes(gender)),
                  },
                  updateProfileCompletedProp: true,
               },
               ctx,
            );
         } else if (user["gender"] != null) {
            let genderFromProps: Gender[] = [];
            const likesGendersFromProps: Gender[] = [];

            if (user["likesWomanTrans"] === true) {
               likesGendersFromProps.push(Gender.TransgenderWoman);
            }
            if (user["likesManTrans"] === true) {
               likesGendersFromProps.push(Gender.TransgenderMan);
            }
            if (user["likesWoman"] === true) {
               likesGendersFromProps.push(Gender.Woman);
            }
            if (user["likesMan"] === true) {
               likesGendersFromProps.push(Gender.Man);
            }
            if (user["likesOtherGenders"] === true) {
               likesGendersFromProps.push(...NON_CIS_GENDERS.filter(gender => !TRANS_GENDERS.includes(gender)));
            }

            if (CIS_GENDERS.includes(user["gender"])) {
               genderFromProps = [user["gender"]];
            } else {
               genderFromProps = [Gender.Woman, Gender.Man];
               if (user["gender"] === Gender.TransgenderMan) {
                  genderFromProps.push(Gender.TransgenderMan);
               }
               if (user["gender"] === Gender.TransgenderWoman) {
                  genderFromProps.push(Gender.TransgenderWoman);
               }
            }

            await userPost(
               {
                  token: user.token,
                  props: {
                     genders: genderFromProps,
                     likesGenders: likesGendersFromProps,
                  },
                  updateProfileCompletedProp: true,
               },
               ctx,
            );
         }

         await removeSubscriptionToTagsPost({ token: user.token, tagIds: genderTagsSubscribed });
         await removeBlockToTagsPost({ token: user.token, tagIds: genderTagsBlocked });

         await sendQuery(() =>
            g
               .V()
               .has("token", token)
               .properties(
                  "gender",
                  "likesWomanTrans",
                  "targetGenderIsSelected",
                  "likesWoman",
                  "likesOtherGenders",
                  "likesMan",
                  "likesManTrans",
               )
               .drop()
               .iterate(),
         );
      }

      await sendQuery(() => g.V().hasLabel("tag").has("category", "gender").drop().iterate());

      return allNames;
   });
}
