import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { cardinality, g, sendQuery, __ } from "../../common-tools/database-tools/database-manager";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { APP_AUTHORED_TAGS, QUESTIONS } from "../../configurations";
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
import {
   queryToGetAllCompleteUsers,
   queryToGetAllUsers,
   queryToGetUserById,
   queryToGetUserByToken,
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

   // const newTagsIds = {
   //    "q05-a01": "couple",
   //    "q06-a01": "unicornHunters",
   //    "q03-a00-v2": "groupDate",
   //    "q03-a01-v2": "only3",
   //    "q03-a02-v2": "withSomeone",
   //    "q04-a01": "sexDirectly",
   //    "q04-a02": "anyActivity",
   //    "q00-a00": "feminism",
   //    "q00-a01": "antiFeminist",
   // };

   // const newAnswerIds = {
   //    ...newTagsIds,
   //    "q06-a02": "notUnicornHunters",
   //    "q05-a01": "justMe",
   // };

   createRoute(r, "/testing/temp", "GET", async (params: any, ctx: BaseContext) => {
      // await notifyAllUsersAboutNewCards();

      // const allTags = await fromQueryToTagList(g.V().hasLabel("tag").has("global", true));

      // let tagsDone = 0;
      // for (const tag of allTags) {
      //    if (newTagsIds[tag.tagId] == null) {
      //       continue;
      //    }
      //    const newTagId: string = newTagsIds[tag.tagId];

      //    let traversal = g.V().hasLabel("tag").has("tagId", tag.tagId);
      //    traversal.property(cardinality.single, "tagId", newTagId);

      //    await sendQuery(() => traversal.iterate());

      //    tagsDone++;
      //    console.log(`done: ${tagsDone}/${allTags.length}`);
      // }

      // console.log("Finished with tags");

      // let usersDone = 0;
      // const allUsers = await fromQueryToUserList(queryToGetAllUsers(), false, false);
      // for (const user of allUsers) {
      //    let newQuestionsResponded: AnswerIds[] = user.questionsResponded?.map(response => {
      //       const question = QUESTIONS.find(q => q.answers.find(a => a.answerId === response.answerId) != null);
      //       if (question == null) {
      //          return null;
      //       }

      //       return { questionId: question.questionId, answerId: response.answerId };
      //    });

      //    if (newQuestionsResponded == null) {
      //       continue;
      //    }

      //    newQuestionsResponded = newQuestionsResponded?.filter(q => q != null);

      //    const traversal = queryToGetUserById(user.userId).property(
      //       cardinality.single,
      //       "questionsResponded",
      //       encodeString(serializeIfNeeded(newQuestionsResponded) as unknown as string),
      //    );

      //    await sendQuery(() => traversal.iterate());

      //    usersDone++;
      //    console.log(`done: ${usersDone}/${allUsers.length}`);
      // }

      // console.log("Finished with users");

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
