import * as moment from 'moment';
import { MarkRequired } from 'ts-essentials';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, column, g } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { DateIdea, DayOption, Group, GroupChat } from '../../shared-tools/endpoints-interfaces/groups';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { queryToGetUserById } from '../common/queries';

/**
 * Creates an empty group and returns it as a traversal query
 */
export function queryToCreateGroup(dayOptions: DayOption[]): Traversal {
   return g
      .addV('group')
      .property('groupId', uuidv1())
      .property(
         'chat',
         serializeIfNeeded<GroupChat>({
            usersDownloadedLastMessage: [],
            messages: [],
         }),
      )
      .property('creationDate', moment().unix())
      .property('dateIdeas', serializeIfNeeded([]))
      .property('dayOptions', serializeIfNeeded(dayOptions))
      .property('usersThatAccepted', serializeIfNeeded([]))
      .property('feedback', serializeIfNeeded([]));
}

/**
 * Receives a traversal that selects one or more groups vertices, returns the groups including the members list.
 */
export function queryToIncludeMembersListInGroup(traversal: Traversal): Traversal {
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

export function queryToGetGroupById(groupId: string, onlyIfAMemberHasUserId?: string): Traversal {
   let traversal = g.V().has('group', 'groupId', groupId);

   if (onlyIfAMemberHasUserId != null) {
      traversal = traversal.where(__.in_('member').has('userId', onlyIfAMemberHasUserId));
   }

   return traversal;
}

export function queryToGetGroupsOfUserByUserId(userId: string): Traversal {
   return queryToGetUserById(userId).out('member');
}

export function queryToUpdateGroupProperty(
   group: MarkRequired<Partial<Group>, 'groupId'>,
   onlyIfAMemberHasUserId?: string,
): Promise<void> {
   let traversal = queryToGetGroupById(group.groupId, onlyIfAMemberHasUserId);

   for (const key of Object.keys(group)) {
      traversal = traversal.property(key, serializeIfNeeded(group[key]));
   }

   return traversal.iterate();
}

export async function queryToAddUserToGroup(user: User, group: Group): Promise<void> {
   await queryToGetUserById(user.userId)
      .addE('member')
      .to(__.V().has('group', 'groupId', group.groupId))
      .iterate();
}

export async function queryToAddDateIdeaToGroup(group: Group, dateIdea: DateIdea): Promise<void> {
   return queryToUpdateGroupProperty({ groupId: group.groupId, dateIdeas: [...group.dateIdeas, dateIdea] });
}
