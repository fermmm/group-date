import { __, column, order, P, scope, t } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import {
   GROUP_SLOTS_CONFIGS,
   MAXIMUM_INACTIVITY_FOR_NEW_GROUPS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
   SHOW_BAD_QUALITY_GROUPS_TIME,
} from '../../configurations';
import { queryToGetAllCompleteUsers } from '../common/queries';
import { GroupQuality, SizeRestriction } from './models';
import * as moment from 'moment';

/**
 * This query returns lists of users arrays where it's users matches between them.
 * This search is required to create new "group candidates". It's the core feature of the app.
 */
export function queryToGetGroupCandidates(targetSlotIndex: number, quality: GroupQuality): Traversal {
   let traversal: Traversal;

   switch (quality) {
      case GroupQuality.Good:
         traversal = queryToGetUsersAllowedToBeOnGroups(targetSlotIndex);
         traversal = queryToSearchGoodQualityMatchingGroups(traversal);
         break;
      case GroupQuality.Bad:
         traversal = queryToGetUsersAllowedToBeOnBadGroups(targetSlotIndex);
         traversal = queryToSearchBadQualityMatchingGroups(traversal);
         break;
   }

   traversal = queryToAddDetailsAndIgnoreInvalidSizes(traversal, GROUP_SLOTS_CONFIGS[targetSlotIndex], true);

   return traversal;
}

/**
 * This query returns a list of users that can be added in active groups that are open to receive new users.
 * Includes the group members and their matches.
 */
export function queryToGetUsersToAddInActiveGroups(targetSlotIndex: number): Traversal {
   let traversal: Traversal;
   traversal = queryToGetUsersAllowedToBeOnGroups(targetSlotIndex);
   traversal = queryToFindUsersToAddInActiveGroups(traversal, GROUP_SLOTS_CONFIGS[targetSlotIndex]);
   return traversal;
}

function queryToGetUsersAllowedToBeOnGroups(targetSlotIndex: number): Traversal {
   return (
      queryToGetAllCompleteUsers()
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
         )
   );
}

function queryToGetUsersAllowedToBeOnBadGroups(targetSlotIndex: number): Traversal {
   return queryToGetUsersAllowedToBeOnGroups(targetSlotIndex).where(
      __.values('lastGroupJoinedDate').is(P.lt(moment().unix() - SHOW_BAD_QUALITY_GROUPS_TIME)),
   );
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
function queryToSearchGoodQualityMatchingGroups(traversal: Traversal): Traversal {
   return (
      traversal
         .as('a')

         // Find the supported figures made of matched users: triangles and squares
         .union(
            __.repeat(__.both('Match').simplePath())
               .times(2)
               .where(__.both('Match').as('a'))
               .path()
               .from_('a'),

            __.repeat(__.both('Match').simplePath())
               .times(3)
               .where(__.both('Match').as('a'))
               .path()
               .from_('a'),
         )

         // Remove duplicate users of the figures
         .map(
            __.unfold()
               .order()
               .by(t.id)
               .dedup()
               .fold(),
         )
         .dedup()
         .group('m')
         .by(__.range(scope.local, 0, 1))
         .group('m')
         .by(__.range(scope.local, 1, 2))
         .group('m')
         .by(__.range(scope.local, 2, 3))
         .group('m')
         .by(__.union(__.limit(scope.local, 1), __.tail(scope.local, 1)).fold())

         // Combine the grouped figures
         .cap('m')
         .unfold()

         .map(
            __.select(column.values)
               .unfold()
               .dedup()
               .fold()
               // Here we remove users if the group is larger than the maximum allowed
               // but shapes are removed instead of specific users, this way the group
               // can lose users and lose fewer connections
               .choose(
                  __.unfold()
                     .unfold()
                     .dedup()
                     .count()
                     .is(P.gt(MAX_GROUP_SIZE)),
                  __.repeat(__.range(scope.local, 1, -1)).until(
                     __.unfold()
                        .unfold()
                        .dedup()
                        .count()
                        .is(P.lte(MAX_GROUP_SIZE)),
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
         )
         .dedup()
   );
}

/**
 * Receives a traversal with all the users allowed to be in this bad quality groups and returns
 * arrays of matching users that are not so well connected.
 *
 * These groups are "circles" of users with 2 connections each, can be visualized as a round of
 * people.
 *
 * To test the query easily:
 * https://gremlify.com/o9rye6xy5od
 */
function queryToSearchBadQualityMatchingGroups(traversal: Traversal): Traversal {
   const searches: Traversal[] = [];

   for (let i = 5; i <= MAX_GROUP_SIZE; i++) {
      searches.push(
         __.repeat(__.both('Match').simplePath())
            .times(i - 1)
            .where(__.both('Match').as('a'))
            .path()
            .from_('a'),
      );
   }

   return (
      traversal
         .as('a')

         // Find shapes
         .union(...searches)

         // Remove duplicates. Also ordering the users is needed here so dedup recognizes all the groups as the same one
         .map(
            __.unfold()
               .order()
               .by(t.id)
               .dedup()
               .fold(),
         )
         .dedup()
   );
}

/**
 * Receives a traversal with a list of users arrays and for each user adds it's matches within the group. This extra
 * info is required by the group quality analyzer.
 * Also ignores groups that are outside the size restrictions selected.
 *
 * To test the query easily:
 * https://gremlify.com/5lgbctob8n4
 *
 *
 * @param sizeRestriction Size restriction. This is not to limit the group size, it's for ignoring groups with sizes outside the limits passed.
 * @param returnNames Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsAndIgnoreInvalidSizes(
   traversal: Traversal,
   sizeRestriction?: SizeRestriction,
   returnNames: boolean = false,
): Traversal {
   return traversal.map(
      __.where(
         __.count(scope.local)
            .is(P.gte(MIN_GROUP_SIZE))
            .is(P.gte(sizeRestriction?.minimumSize ?? 0))
            .is(P.lte(sizeRestriction?.maximumSize ?? 1000000)),
      )
         .as('g')
         .unfold()
         .map(
            __.project('user', 'matches')
               .by(__.values(returnNames ? 'name' : 'userId'))
               .by(
                  __.as('u')
                     .select('g')
                     .unfold()
                     .where(__.both('Match').where(P.eq('u'))) // Get the matches of the user within the group
                     .values(returnNames ? 'name' : 'userId')
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
 * Receives a traversal with a list of users and returns a list of users with the active groups where each user can
 * be added, also details of the groups are included.
 * Active groups are open to adding new users as long as the new user has 2 matches within the members of the group.
 *
 * To play with this query:
 * https://gremlify.com/j974mw21khq
 */
function queryToFindUsersToAddInActiveGroups(
   traversal: Traversal,
   sizeRestriction?: SizeRestriction,
): Traversal {
   return (
      traversal
         .map(
            __.as('user')
               .project('userId', 'groups')
               .by(__.values('userId'))
               .by(
                  // Find the groups where the user has 2 matches
                  __.both('Match')
                     .out('member')
                     .where(
                        __.in_('member')
                           .simplePath()
                           .where(__.both('Match').as('user')),
                     )

                     // Not groups where the user already belongs
                     .not(__.where(__.in_('member').as('user')))
                     // Groups where the size is desired
                     .where(
                        __.in_('member')
                           .count()
                           .is(P.lt(MAX_GROUP_SIZE)) // Not groups already full
                           .is(P.gte(sizeRestriction.minimumSize)) // Groups bigger than the minimum size in slot
                           .is(P.lte(sizeRestriction.maximumSize)), // Not groups bigger than the target slot size
                     )
                     // Groups that are new
                     .where(__.has('creationDate', P.gt(moment().unix() - MAX_TIME_GROUPS_RECEIVE_NEW_USERS)))

                     .dedup()
                     .project('groupId', 'membersAndMatches')
                     .by(__.values('groupId'))
                     .by(
                        // Get members of the group and their matches (not including the possible new member)
                        __.as('group')
                           .in_('member')
                           .project('user', 'matches')
                           .by(__.values('userId'))
                           .by(
                              __.both('Match')
                                 .where(__.out('member').as('group'))
                                 .values('userId')
                                 .fold(),
                           )
                           .fold(),
                     )
                     .fold(),
               ),
         )
         // Remove empty results
         .where(__.select('groups').unfold())
   );
}
