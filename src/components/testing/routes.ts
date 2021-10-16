import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { Console } from "winston/lib/winston/transports";
import { g, sendQuery, __ } from "../../common-tools/database-tools/database-manager";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { notifyAllUsersAboutNewCards } from "../cards-game/models";
import { queryToGetAllUsers } from "../user/queries";
import { fromQueryToUserList } from "../user/tools/data-conversion";
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
      console.time("notify");
      // await notifyAllUsersAboutNewCards();
      console.timeEnd("notify");
      return "done";
   });
}
