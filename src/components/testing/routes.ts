import * as Router from "@koa/router";
import { BaseContext } from "koa";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { createMatchingUsers } from "../../tests/tools/groups";
import { createFakeUser, createFakeUsers } from "../../tests/tools/users";
import { userGet } from "../user/models";
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
      const user = await createFakeUser();
      const userUpdated = await userGet({ token: user.token }, ctx);
      return userUpdated;
   });
}
