import { process } from 'gremlin';
import * as moment from 'moment';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, column, g } from '../../common-tools/database-tools/database-manager';
import { ChatMessage } from '../../shared-tools/endpoints-interfaces/common';
import { getUserTraversalById } from '../common/queries';

export function getAdminChatMessages(userId: string, includeUserData: boolean): process.GraphTraversal {
   const projectWithoutUserData: process.GraphTraversal = __.valueMap().by(__.unfold());

   const projectWithUserData: process.GraphTraversal = __.union(
      projectWithoutUserData,
      __.project('nonAdminUser').by(
         __.select('user')
            .valueMap()
            .by(__.unfold()),
      ),
   )
      .unfold()
      .group()
      .by(__.select(column.keys))
      .by(__.select(column.values));

   return getUserTraversalById(userId)
      .as('user')
      .out('chatWithAdmins')
      .choose(__.identity(), includeUserData ? projectWithUserData : projectWithoutUserData);
}

export function saveAdminChatMessage(
   userId: string,
   updatedMessagesList: ChatMessage[],
   lastMessageIsFromAdmin: boolean,
): process.GraphTraversal {
   return getUserTraversalById(userId)
      .as('user')
      .coalesce(
         __.out('chatWithAdmins'),
         __.addV('chatWithAdmins')
            .as('x')
            .addE('chatWithAdmins')
            .from_('user')
            .select('x'),
      )
      .property('messages', serializeIfNeeded(updatedMessagesList))
      .property('adminHasResponded', lastMessageIsFromAdmin)
      .property('lastMessageDate', moment().unix());
}

export function getAllChatsWithAdmins(excludeRespondedByAdmin: boolean): process.GraphTraversal {
   const projectWithUserData: process.GraphTraversal = __.union(
      __.valueMap().by(__.unfold()),
      __.project('nonAdminUser').by(
         __.select('user')
            .valueMap()
            .by(__.unfold()),
      ),
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
      __.as('chat')
         .in_('chatWithAdmins')
         .as('user')
         .select('chat')
         .choose(__.identity(), projectWithUserData),
   );
}
