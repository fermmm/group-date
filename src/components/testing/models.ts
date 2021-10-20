import * as moment from "moment";
import { BaseContext } from "koa";
import { getRandomInt } from "./../../common-tools/math-tools/general";
import { TokenParameter } from "../../shared-tools/endpoints-interfaces/common";
import { Tag, TagCreateParams } from "../../shared-tools/endpoints-interfaces/tags";
import { AttractionType } from "../../shared-tools/endpoints-interfaces/user";
import { chance } from "../../tests/tools/generalTools";
import { createFakeCompatibleUsers } from "../../tests/tools/users";
import { searchAndCreateNewGroups } from "../groups-finder/models";
import { createTagPost, subscribeToTagsPost } from "../tags/models";
import { retrieveFullyRegisteredUser, setAttractionPost } from "../user/models";
import { APP_AUTHORED_TAGS } from "../../configurations";
import { chatPost, userGroupsGet } from "../groups/models";
import { fromQueryToUser } from "../user/tools/data-conversion";
import { queryToGetUserById } from "../user/queries";

const allUsersCreated = [];
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
   allUsersCreated.push(...usersCreated);

   for (let i = 0; i < usersCreated.length; i++) {
      const userCreated = usersCreated[i];
      if (i % 2 == 0) {
         await subscribeToTagsPost({ token: userCreated.token, tagIds: [APP_AUTHORED_TAGS[0].tagId] });
      } else {
         await subscribeToTagsPost({ token: userCreated.token, tagIds: [APP_AUTHORED_TAGS[1].tagId] });
      }
   }

   for (const userCreated of allUsersCreated) {
      await setAttractionPost(
         {
            token: userCreated.token,
            attractions: [
               ...allUsersCreated.map(otherUser => ({
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

export async function createFakeTagsPost(
   params: TokenParameter & { text: string },
   ctx: BaseContext,
): Promise<string> {
   const user = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      return `Error: Only admins can use this`;
   }

   const tagsCreated: Tag[] = [];
   for (let i = 0; i < Number(params.text); i++) {
      const tagParams: TagCreateParams = {
         token: user.token,
         name: chance.sentence({ words: getRandomInt(1, 3) }),
         category: chance.sentence({ words: 1 }),
         creationDate: moment().subtract(i, "days").unix(),
         lastInteractionDate: moment().subtract(getRandomInt(0, i), "days").unix(),
         fakeSubscribersAmount: Math.random() < 0.5 ? i * 2 : getRandomInt(0, 5),
         fakeBlockersAmount: Math.random() < 0.5 ? Math.floor(i * 0.2) : 0,
      };

      tagsCreated.push(await createTagPost(tagParams, ctx));
   }

   return `${tagsCreated.length} tags created!`;
}

export async function forceGroupSearch(params: TokenParameter, ctx: BaseContext): Promise<string> {
   const user = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      return `Error: Only admins can use this`;
   }

   const groupsCreated = await searchAndCreateNewGroups();

   return `Created ${groupsCreated.length} groups.`;
}

export async function createFakeChatConversation(params: TokenParameter, ctx: BaseContext): Promise<string> {
   const user = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      return `Error: Only admins can use this`;
   }

   const fakeConversation = [
      "holaaa son muy bellos todos",
      "lo mismo digo",
      "esta lindo el dia, vamos a la playa?",
      "sii, yo puedo =)",
      "yo tambien puedo!!!",
      "yendo",
      "yo me libero en 10",
      "si vamos",
      "yo no! pero la proxima me sumo! =)",
      "eh... me parece una muy buena idea",
   ];

   const groups = await userGroupsGet({ token: params.token }, ctx, true);
   let currentConversationMessage = 0;
   for (const group of groups) {
      for (const member of group.members) {
         const message = fakeConversation[currentConversationMessage];
         const chatUser = await fromQueryToUser(queryToGetUserById(member.userId), true);
         await chatPost({ token: chatUser.token, groupId: group.groupId, message }, ctx);
         currentConversationMessage++;
         if (currentConversationMessage >= fakeConversation.length) {
            currentConversationMessage = 0;
         }
      }
   }

   return `Created fake conversation.`;
}
