import * as Router from "@koa/router";
import { createFakeCompatibleUsers, createFakeUser } from "../../tests/tools/users";
import { retrieveFullyRegisteredUser, retrieveUser } from "../user/models";
import { queryToRemoveUsers } from "../user/queries";

export function testingRoutes(router: Router): void {
   router.get("/testing", async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();
   });

   router.get("/testing2", async ctx => {
      await createFakeCompatibleUsers(
         await retrieveFullyRegisteredUser(ctx.request.query.token, false, ctx),
         Number(ctx.request.query.text),
      );
      ctx.body = `Finished OK`;
   });
}
