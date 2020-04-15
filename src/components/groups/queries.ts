import { process } from 'gremlin';
import { MarkRequired } from 'ts-essentials';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, column, g } from '../../common-tools/database-tools/database-manager';
import { Chat } from '../../shared-tools/endpoints-interfaces/common';
import { DateIdea, Group } from '../../shared-tools/endpoints-interfaces/groups';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { getUserTraversalById } from '../common/queries';

/**
 * Creates an empty group and returns it as a traversal query
 */
export function queryToCreateGroup(): process.GraphTraversal {
   return g
      .addV('group')
      .property('groupId', uuidv1())
      .property(
         'chat',
         serializeIfNeeded<Chat>({
            usersTyping: [],
            usersDownloadedLastMessage: [],
            messages: [],
         }),
      )
      .property('members', serializeIfNeeded([]))
      .property('dateIdeas', serializeIfNeeded([]))
      .property('usersThatAccepted', serializeIfNeeded([]))
      .property('feedback', serializeIfNeeded([]));
}

export function addMembersToGroupTraversal(traversal: process.GraphTraversal): process.GraphTraversal {
   traversal = traversal.map(
      __.union(
         __.valueMap().by(__.unfold()),
         __.project('members').by(
            __.in_('member')
               .valueMap()
               .by(__.unfold())
               .fold(),
         ),
      )
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );

   return traversal;
}

export function getGroupTraversalById(groupId: string): process.GraphTraversal {
   return g.V().has('group', 'groupId', groupId);
}

export function getGroupsOfUserById(userId: string): process.GraphTraversal {
   return getUserTraversalById(userId).out('member');
}

export function updateGroup(group: MarkRequired<Partial<Group>, 'groupId'>): Promise<void> {
   let traversal = getGroupTraversalById(group.groupId);

   for (const key of Object.keys(group)) {
      traversal = traversal.property(key, serializeIfNeeded(group[key]));
   }

   return traversal.iterate();
}

export async function addUserToGroup(user: User, group: Group): Promise<void> {
   await getUserTraversalById(user.userId)
      .addE('member')
      .to(__.V().has('group', 'groupId', group.groupId))
      .iterate();
}

export async function addDateIdeaToGroup(group: Group, dateIdea: DateIdea): Promise<void> {
   return updateGroup({ groupId: group.groupId, dateIdeas: [...group.dateIdeas, dateIdea] });
}
