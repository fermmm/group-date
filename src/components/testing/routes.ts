import * as Router from "@koa/router";
import { createFakeUser } from "../../tests/tools/users";
import { queryToRemoveUsers } from "../user/queries";
import { createFakeUsersPost } from "./models";

export function testingRoutes(router: Router): void {
   router.get("/testing", async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();
   });

   router.get("/createFakeUsers", async ctx => (ctx.body = await createFakeUsersPost(ctx.request.query, ctx)));
}
