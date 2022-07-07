import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { cardinality, g, sendQuery, __ } from "../../common-tools/database-tools/database-manager";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { QUESTIONS } from "../../configurations";
import { AnswerIds } from "../../shared-tools/endpoints-interfaces/user";
import { encodeString } from "../../shared-tools/utility-functions/encodeString";
import { GROUP_PROPS_TO_ENCODE, GROUP_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/group";
import { TAG_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/tags";
import { USER_PROPS_TO_ENCODE_AS_ARRAY } from "../../shared-tools/validators/user";
import { fakeCtx } from "../../tests/tools/replacements";
import { notifyUsersAboutNewCards } from "../cards-game/models";
import { sendNewGroupNotification } from "../groups/models";
import { queryToGetAllGroups, queryToGetAllGroupsOfUser, queryToGetGroupById } from "../groups/queries";
import { fromQueryToGroupList } from "../groups/tools/data-conversion";
import { queryToGetTags } from "../tags/queries";
import { fromQueryToTagList } from "../tags/tools/data-conversion";
import { userPost } from "../user/models";
import { queryToGetAllUsers, queryToGetUserByToken } from "../user/queries";
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
