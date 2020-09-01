import * as moment from 'moment';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, column, g } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { ChatMessage } from '../../shared-tools/endpoints-interfaces/common';
import { queryToGetUserById } from '../user/queries';

export function queryToGetAdminChatMessages(userId: string, includeUserData: boolean): Traversal {
   const projectWithoutUserData: Traversal = __.valueMap().by(__.unfold());

   const projectWithUserData: Traversal = __.union(
      projectWithoutUserData,
      __.project('nonAdminUser').by(__.select('user').valueMap().by(__.unfold())),
   )
      .unfold()
      .group()
      .by(__.select(column.keys))
      .by(__.select(column.values));

   return queryToGetUserById(userId)
      .as('user')
      .out('chatWithAdmins')
      .choose(__.identity(), includeUserData ? projectWithUserData : projectWithoutUserData);
}

export function queryToSaveAdminChatMessage(
   userId: string,
   updatedMessagesList: ChatMessage[],
   lastMessageIsFromAdmin: boolean,
): Traversal {
   return queryToGetUserById(userId)
      .as('user')
      .coalesce(
         __.out('chatWithAdmins'),
         __.addV('chatWithAdmins').as('x').addE('chatWithAdmins').from_('user').select('x'),
      )
      .property('messages', serializeIfNeeded(updatedMessagesList))
      .property('adminHasResponded', lastMessageIsFromAdmin)
      .property('lastMessageDate', moment().unix());
}

export function queryToGetAllChatsWithAdmins(excludeRespondedByAdmin: boolean): Traversal {
   const projectWithUserData: Traversal = __.union(
      __.valueMap().by(__.unfold()),
      __.project('nonAdminUser').by(__.select('user').valueMap().by(__.unfold())),
   )
      .unfold()
      .group()
      .by(__.select(column.keys))
      .by(__.select(column.values));

   let traversal = g.V().hasLabel('chatWithAdmins');

   if (excludeRespondedByAdmin) {
      traversal = traversal.not(__.has('adminHasResponded', true));
   }

   return traversal.map(
      __.as('chat').in_('chatWithAdmins').as('user').select('chat').choose(__.identity(), projectWithUserData),
   );
}
