import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { cardinality, g, sendQuery, __ } from "../../common-tools/database-tools/database-manager";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { encodeString } from "../../shared-tools/utility-functions/encodeString";
import { GROUP_PROPS_TO_ENCODE, GROUP_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/group";
import { TAG_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/tags";
import { USER_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/user";
import { notifyUsersAboutNewCards } from "../cards-game/models";
import { sendNewGroupNotification } from "../groups/models";
import { queryToGetAllGroups, queryToGetAllGroupsOfUser, queryToGetGroupById } from "../groups/queries";
import { fromQueryToGroupList } from "../groups/tools/data-conversion";
import { queryToGetTags } from "../tags/queries";
import { fromQueryToTagList } from "../tags/tools/data-conversion";
import {
   queryToGetAllCompleteUsers,
   queryToGetAllUsers,
   queryToGetUserByToken,
   queryToSetUserProps,
} from "../user/queries";
import { fromQueryToUser, fromQueryToUserList } from "../user/tools/data-conversion";
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
      console.time("start");

      /**
       * ENCODE USER DATA
       */
      const allUsers = await fromQueryToUserList(
         queryToGetAllUsers({ includeDemoAccounts: true }),
         false,
         false,
      );

      let amountDone = 0;
      for (const user of allUsers) {
         let traversal = queryToGetUserByToken(user.token);

         console.log(`done: ${amountDone}/${allUsers.length}`);
         amountDone++;

         for (const propName of USER_PROPS_TO_ENCODE_AS_ARRAY) {
            if (user[propName] == null) {
               continue;
            }

            traversal = traversal.property(
               cardinality.single,
               propName,
               encodeString(serializeIfNeeded(user[propName]) as unknown as string),
            );
         }

         await sendQuery(() => traversal.iterate());
      }

      console.log("Finished with users");

      /**
       * ENCODE GROUP DATA
       */
      const allGroups = await fromQueryToGroupList(queryToGetAllGroups(true), false, false);

      let groupsDone = 0;
      for (const group of allGroups) {
         let traversal = queryToGetGroupById(group.groupId);

         console.log(`done: ${groupsDone}/${allGroups.length}`);
         groupsDone++;

         for (const propName of GROUP_PROPS_TO_ENCODE_AS_ARRAY) {
            if (group[propName] == null) {
               continue;
            }

            traversal = traversal.property(
               cardinality.single,
               propName,
               encodeString(serializeIfNeeded(group[propName]) as unknown as string),
            );
         }

         await sendQuery(() => traversal.iterate());
      }

      console.log("Finished with groups");

      /**
       * ENCODE TAGS DATA
       */
      const allTags = await fromQueryToTagList(g.V().hasLabel("tag"));

      let tagsDone = 0;
      for (const tag of allTags) {
         let traversal = g.V().hasLabel("tag").has("tagId", tag.tagId);

         console.log(`done: ${tagsDone}/${allTags.length}`);
         tagsDone++;

         for (const propName of TAG_PROPS_TO_ENCODE_AS_ARRAY) {
            if (tag[propName] == null) {
               continue;
            }

            traversal = traversal.property(
               cardinality.single,
               propName,
               encodeString(serializeIfNeeded(tag[propName]) as unknown as string),
            );
         }

         await sendQuery(() => traversal.iterate());
      }

      console.log("Finished with tags");

      // await notifyAllUsersAboutNewCards();

      // const allUsers = await fromQueryToUserList(queryToGetAllCompleteUsers(), false, false);
      // for (const user of allUsers) {
      //    if (user.images?.length != null) {
      //       let query = queryToGetUserByToken(user.token);
      //       query = query.property("imagesAmount", user.images.length);
      //       await sendQuery(() => query.iterate());
      //    }
      // }

      // console.log("Done");
      // console.timeEnd("notify");

      // const groups = await fromQueryToGroupList(queryToGetAllGroups());

      // for (const group of groups) {
      //    for (const member of group.members) {
      //       await sendNewGroupNotification(member.userId, group);
      //    }
      // }
      return "done";
   });
}
