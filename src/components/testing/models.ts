import { BaseContext } from "koa";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { AttractionType } from "../../shared-tools/endpoints-interfaces/user";
import { createFakeCompatibleUsers } from "../../tests/tools/users";
import { searchAndCreateNewGroups } from "../groups-finder/models";
import { retrieveFullyRegisteredUser, setAttractionPost } from "../user/models";

export async function createFakeUsersPost(
   params: TokenParameter & { text: string },
   ctx: BaseContext,
): Promise<string> {
   const user = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      return `Error: Only admins can use this`;
   }

   const usersCreated = await createFakeCompatibleUsers(
      await retrieveFullyRegisteredUser(params.token, false, ctx),
      Number(params.text),
   );

   for (const userCreated of usersCreated) {
      await setAttractionPost(
         {
            token: userCreated.token,
            attractions: [
               ...usersCreated.map(otherUser => ({
                  userId: otherUser.userId,
                  attractionType: AttractionType.Like,
               })),
               { userId: user.userId, attractionType: AttractionType.Like },
            ],
         },
         ctx,
      );
   }

   return "Users created";
}

export async function forceGroupSearch(): Promise<string> {
   const groupsCreated = await searchAndCreateNewGroups();
   return `Created ${groupsCreated.length} groups.`;
}
