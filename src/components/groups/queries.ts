import { process } from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { g } from '../../common-tools/database-tools/database-manager';

/**
 * Creates an empty group and returns it as a traversal query
 */
export function queryToCreateGroup(): process.GraphTraversal {
   return g
      .addV('group')
      .property('groupId', uuidv1())
      .property(
         'chat',
         serializeIfNeeded({
            usersTyping: [],
            usersReadLastMessage: [],
            messages: [],
         }),
      )
      .property('dateIdeas', serializeIfNeeded([]))
      .property('usersThatAccepted', serializeIfNeeded([]))
      .property('feedback', serializeIfNeeded([]));
}
