import { __, column, order, P, scope, t, g } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import {
   GROUP_SLOTS_CONFIGS,
   MAXIMUM_INACTIVITY_FOR_NEW_GROUPS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
   FORM_BAD_QUALITY_GROUPS_TIME,
   ALLOW_SMALL_GROUPS_BECOME_BIG,
} from '../../configurations';
import * as moment from 'moment';
import { queryToGetAllCompleteUsers } from '../user/queries';
import { GroupQuality, SizeRestriction } from './tools/types';
import { MINIMUM_CONNECTIONS_TO_BE_ON_GROUP } from '../../configurations';

/**
 * This query returns lists of users arrays where it's users matches between them.
 * This search is required to create new "group candidates" these groups candidates are later converted
 * into real groups. This is the core feature of the app.
 */
export function queryToGetGroupCandidates(targetSlotIndex: number, quality: GroupQuality): Traversal {
   let traversal: Traversal;

   switch (quality) {
      case GroupQuality.Good:
         traversal = queryToSearchGoodQualityMatchingGroups(targetSlotIndex);
         break;
      case GroupQuality.Bad:
         traversal = queryToSearchBadQualityMatchingGroups(targetSlotIndex);
         break;
   }

   traversal = queryToAddDetailsAndIgnoreInvalidSizes(traversal, GROUP_SLOTS_CONFIGS[targetSlotIndex]);

   return traversal;
}

/**
 * Returns a list of groups that are recently created so they still can receive new users along with a list of users
 * that can be added to each group. Also details of each group are included.
 * Active groups are open to adding new users as long as the new user has 2 matches within the members of the group.
 */
export function queryToGetGroupsReceivingNewUsers(
   targetSlotIndex: number,
   targetQuality: GroupQuality,
): Traversal {
   return queryToFindUsersToAddInActiveGroups(targetSlotIndex, targetQuality);
}

/**
 * Receives a traversal with a list of users and only keeps the ones allowed to be on a new group
 * according to the given group slot.
 * If no traversal is provided then it will start with all complete users and then filter that list.
 */
function queryToGetUsersAllowedToBeOnGroups(
   targetSlotIndex: number,
   quality: GroupQuality,
   traversal?: Traversal,
): Traversal {
   traversal = traversal ?? queryToGetAllCompleteUsers();
   traversal = traversal
      // Only users with not too many groups already active can be part of new group searches
      .where(
         __.outE('slot' + targetSlotIndex)
            .count()
            .is(P.lt(GROUP_SLOTS_CONFIGS[targetSlotIndex].amount)),
      )

      // Don't introduce inactive users into the groups candidates.
      // Inactive means many time without login and no new users notifications pending
      .not(
         __.has('lastLoginDate', P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_NEW_GROUPS))
            .and()
            .has('sendNewUsersNotification', 0),
      );

   if (quality === GroupQuality.Bad) {
      traversal = traversal.where(
         __.values('lastGroupJoinedDate').is(P.lt(moment().unix() - FORM_BAD_QUALITY_GROUPS_TIME)),
      );
   }

   return traversal;
}

/**
 * Generates an anonymous traversal with a user and returns it's matches as long as the matches are users
 * allowed to be on groups
 */
function queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex: number, quality: GroupQuality): Traversal {
   return queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, quality, __.both('Match'));
}

/**
 * This query finds users that matches together forming a group, it's the core of the app.
 * Returns arrays of matching users.
 *
 * Users can be in a group when the following requirements are fulfilled:
 *
 * 1. A match that has at least 1 match in common can be together in a group (also with the 1+ match in common)
 * 2. If a user of distance 2 has at least 2 matches in common then they can be together in the group (also with the 2+ matches in common)
 *
 * These 2 rules can also be thought of as figures in the graph:
 *    Rule 1 forms a triangle shape and rule 2 forms a square shape.
 *
 * The query meets the objective by finding this figures and then combining them when they have at least 2 users in common, this is another
 * way of thinking these 2 rules and it's the way the query works, so well connected groups of users are found.
 *
 * To test the query easily:
 * https://gremlify.com/5lgbctob8n4
 *
 * Old less performing version:
 * https://gremlify.com/id19z50t41i
 */
function queryToSearchGoodQualityMatchingGroups(targetSlotIndex: number): Traversal {
   return (
      queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good)
         .as('a')
         .union(
            // Find triangles made of matches that are allowed to be on group slot
            __.repeat(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good).simplePath())
               .times(2)
               .where(__.both('Match').as('a'))
               .path()
               .from_('a'),
            // TODO: Si descomento uno de los 2 bloques da timeout parece que si todos se gustan se genera un problema de performance
            // Find squares made of matches that are allowed to be on group slot
            /*__.repeat(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good).simplePath())
               .times(3)
               .where(__.both('Match').as('a'))
               .path()
               .from_('a'),*/
         )

         // Remove duplicate users of the figures
         .map(__.unfold().order().by(t.id).dedup().fold())
         .dedup()
         .group('m')
         .by(__.range(scope.local, 0, 1))
         .group('m')
         .by(__.range(scope.local, 1, 2))
         .group('m')
         .by(__.range(scope.local, 2, 3))
         .group('m')
         .by(__.union(__.limit(scope.local, 1), __.tail(scope.local, 1)).fold())

         // // Combine the grouped figures
         .cap('m')
         .unfold()
         /*
         .map(
            __.select(column.values)
               .unfold()
               .dedup()
               .fold()
               // Here we remove users if the group is larger than the maximum allowed
               // but shapes are removed instead of specific users, this way the group
               // can lose users and lose fewer connections
               .choose(
                  __.unfold().unfold().dedup().count().is(P.gt(MAX_GROUP_SIZE)),
                  __.repeat(__.range(scope.local, 1, -1)).until(
                     __.unfold().unfold().dedup().count().is(P.lte(MAX_GROUP_SIZE)),
                  ),
               )
               .unfold()
               .unfold()
               .dedup()
               // In all the groups we need to order the users in the same way so the next dedup
               // recognizes all the groups as the same group
               .order()
               .by(t.id)
               .fold(),
         )*/
         .dedup()
   );
}

/**
 * This query searches for matching users that are not so well connected so they can form a bad quality group.
 *
 * These groups are "circles" of users with 2 connections each, can be visualized as a round of
 * people.
 *
 * To test the query easily:
 * https://gremlify.com/o9rye6xy5od
 */
function queryToSearchBadQualityMatchingGroups(targetSlotIndex: number): Traversal {
   const searches: Traversal[] = [];

   for (let i = 5; i <= MAX_GROUP_SIZE; i++) {
      searches.push(
         __.repeat(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Bad).simplePath())
            .times(i - 1)
            .where(__.both('Match').as('a'))
            .path()
            .from_('a'),
      );
   }

   return (
      queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Bad)
         .as('a')

         // Find shapes
         .union(...searches)

         // Remove duplicates. Also ordering the users is needed here so dedup recognizes all the groups as the same one
         .map(__.unfold().order().by(t.id).dedup().fold())
         .dedup()
   );
}

/**
 * Receives a traversal with a list of users arrays and for each user adds it's matches within the group. This extra
 * info is required by the group quality analyzer.
 * Also ignores groups that are outside the size restrictions selected.
 *
 * To test the query easily:
 * https://gremlify.com/fzqecgnxi9p
 *
 *
 * @param slotSize Size restriction. This is not to limit the group size, it's for ignoring groups with sizes outside the limits passed.
 * @param returnNames Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsAndIgnoreInvalidSizes(traversal: Traversal, slotSize?: SizeRestriction): Traversal {
   return traversal.map(
      __.where(
         __.count(scope.local)
            .is(P.gte(MIN_GROUP_SIZE))
            .is(P.gte(slotSize?.minimumSize ?? 0))
            .is(P.lte(slotSize?.maximumSize ?? 99999)),
      )
         .as('g')
         .unfold()
         .map(
            __.project('userId', 'matches')
               .by(__.values('userId'))
               .by(
                  __.as('u')
                     .select('g')
                     .unfold()
                     .where(__.both('Match').where(P.eq('u'))) // Get the matches of the user within the group
                     .values('userId')
                     .fold(),
               ),
         )
         .order()
         .by(__.select('matches').count(scope.local), order.desc) // Order the users by their amount of matches
         .fold()
         .choose(__.count(scope.local).is(P.eq(0)), __.unfold()), // Remove empty arrays caused by the group size restrictions
   );
}

/**
 * Returns a list of groups that are recently created so they still can receive new users along with a list of users
 * that can be added to each group. Also details of each group are included.
 * Active groups are open to adding new users as long as the new user has 2 matches within the members of the group.
 *
 * To play with this query:
 * https://gremlify.com/3hrqz4ijyvt
 */
function queryToFindUsersToAddInActiveGroups(slotIndex: number, quality: GroupQuality): Traversal {
   return (
      g
         .V()
         .hasLabel('group')
         // Active groups
         .where(__.has('creationDate', P.gt(moment().unix() - MAX_TIME_GROUPS_RECEIVE_NEW_USERS)))
         // Groups of the target quality. This prevents occupying slots of good quality capable users with low quality groups
         .where(__.has('initialQuality', quality))
         // Groups that has space for more users and match the slot config passed
         .where(
            __.in_('member')
               .count()
               .is(P.lt(MAX_GROUP_SIZE)) // Not groups already full
               .is(P.gte(GROUP_SLOTS_CONFIGS[slotIndex].minimumSize ?? MIN_GROUP_SIZE)) // Groups bigger than the minimum size in slot
               .is(
                  P.lte(
                     ALLOW_SMALL_GROUPS_BECOME_BIG
                        ? MAX_GROUP_SIZE
                        : GROUP_SLOTS_CONFIGS[slotIndex].maximumSize ?? MAX_GROUP_SIZE,
                  ),
               ),
         )

         // Get users to add to these groups
         .project('group', 'usersToAdd')
         .by()
         .by(
            // Find matches of the member group that are not members of the group
            __.as('group')
               .in_('member')
               .both('Match')
               .not(__.where(__.out('member').as('group')))
               // Only include users allowed to be in new groups
               .union(queryToGetUsersAllowedToBeOnGroups(slotIndex, quality, __))
               // Find the matches that the user has inside the group
               .group()
               .by(__.values('userId'))
               .by(__.both('Match').where(__.out('member').as('group')).dedup().values('userId').fold())
               .unfold()
               .project('userId', 'matches')
               .by(column.keys)
               .by(column.values)
               // Discard users with not enough connections amount
               .where(__.select('matches').count(scope.local).is(P.gte(MINIMUM_CONNECTIONS_TO_BE_ON_GROUP)))
               .fold(),
         )
         // Discard groups with no users to add
         .where(__.select('usersToAdd').unfold())

         // Re create the object we have at this point adding "groupMatches" with the members of the
         // group and their matches
         .project('groupId', 'usersToAdd', 'users')
         .by(__.select('group').values('groupId'))
         .by(__.select('usersToAdd'))
         .by(
            // Get members of the group and their matches (it does not include the possible new member)
            __.select('group')
               .as('group')
               .in_('member')
               .project('userId', 'matches')
               .by(__.values('userId'))
               .by(__.both('SeenMatch').where(__.out('member').as('group')).values('userId').fold())
               .fold(),
         )
   );
}
