import { BaseContext } from "koa";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { createFakeCompatibleUsers } from "../../tests/tools/users";
import { retrieveFullyRegisteredUser } from "../user/models";

export async function createFakeUsersPost(
   params: TokenParameter & { text: string },
   ctx: BaseContext,
): Promise<string> {
   const user = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      return `Error: Only admins can use this`;
   }

   await createFakeCompatibleUsers(
      await retrieveFullyRegisteredUser(params.token, false, ctx),
      Number(params.text),
   );

   return `Users created`;
}
