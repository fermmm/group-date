import * as moment from "moment";
import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { __, column, g, cardinality } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { AdminNotificationFilter } from "../../shared-tools/endpoints-interfaces/admin";
import { ChatMessage } from "../../shared-tools/endpoints-interfaces/common";
import { encodeString } from "../../shared-tools/utility-functions/encodeString";
import { queryToGetAllCompleteUsers, queryToGetUserById } from "../user/queries";

export function queryToGetAdminChatMessages(userId: string, includeUserData: boolean): Traversal {
   const projectWithoutUserData: Traversal = __.valueMap().by(__.unfold());

   const projectWithUserData: Traversal = __.union(
      projectWithoutUserData,
      __.project("nonAdminUser").by(__.select("user").valueMap().by(__.unfold())),
   )
      .unfold()
      .group()
      .by(__.select(column.keys))
      .by(__.select(column.values));

   return queryToGetUserById(userId)
      .as("user")
      .out("chatWithAdmins")
      .choose(__.identity(), includeUserData ? projectWithUserData : projectWithoutUserData);
}

export function queryToSaveAdminChatMessage(
   userId: string,
   updatedMessagesList: ChatMessage[],
   lastMessageIsFromAdmin: boolean,
): Traversal {
   let messages = serializeIfNeeded(updatedMessagesList) as string;
   messages = encodeString(messages);

   return queryToGetUserById(userId)
      .as("user")
      .coalesce(
         __.out("chatWithAdmins"),
         __.addV("chatWithAdmins").as("x").addE("chatWithAdmins").from_("user").select("x"),
      )
      .property(cardinality.single, "messages", messages)
      .property(cardinality.single, "adminHasResponded", lastMessageIsFromAdmin)
      .property(cardinality.single, "lastMessageDate", moment().unix());
}

export function queryToGetAllChatsWithAdmins(excludeRespondedByAdmin: boolean): Traversal {
   const projectWithUserData: Traversal = __.union(
      __.valueMap().by(__.unfold()),
      __.project("nonAdminUser").by(__.select("user").valueMap().by(__.unfold())),
   )
      .unfold()
      .group()
      .by(__.select(column.keys))
      .by(__.select(column.values));

   let traversal = g.V().hasLabel("chatWithAdmins");

   if (excludeRespondedByAdmin) {
      traversal = traversal.not(__.has("adminHasResponded", true));
   }

   return traversal.map(
      __.as("chat").in_("chatWithAdmins").as("user").select("chat").choose(__.identity(), projectWithUserData),
   );
}

export function queryToSelectUsersForNotification(filters: AdminNotificationFilter): Traversal {
   const traversal = queryToGetAllCompleteUsers();

   console.log(filters.usersEmail);

   if (filters.usersEmail && filters.usersEmail.length > 0) {
      traversal.union(...filters.usersEmail.map(email => __.has("email", email)));
   }

   return traversal;
}
