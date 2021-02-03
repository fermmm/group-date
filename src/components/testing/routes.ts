import * as Router from "@koa/router";
import { createFakeUser } from "../../tests/tools/users";
import { queryToRemoveUsers } from "../user/queries";
import { createFakeUsersPost, forceGroupSearch } from "./models";

export function testingRoutes(router: Router): void {
   router.get("/testing/temp", async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();
   });

   router.get(
      "/testing/create-fake-users",
      async ctx => (ctx.body = await createFakeUsersPost(ctx.request.query, ctx)),
   );

   router.get("/testing/force-groups-search", async ctx => (ctx.body = await forceGroupSearch()));
}
