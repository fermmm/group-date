import { __, column, g, order, P, scope, t } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import {
   GROUP_SLOTS,
   MAX_GROUP_SIZE,
   MIN_GROUP_SIZE,
   USE_GROUPS_SEARCH_OPTIMIZED_QUERY,
} from '../../configurations';

/*
 *    // TODO: Problema: Si cambio "Match" por "SeenMatch" al crear el grupo, entonces como entran nuevos usuarios con el
 *    grupo ya creado si no se vuelve a computar, lo que se podría hacer es crear una nueva búsqueda pero para
 *    meter usuarios nuevos en grupos ya creados
 */

/**
 * This query returns lists of users arrays where it's users matches between them.
 * This search is required to analyze and then create new groups. It's the core feature of the app.
 */
export function queryToGetPossibleGoodGroups(targetSlotIndex: number): Traversal {
   let traversal = queryToGetUsersAllowedToBeOnGoodGroups(targetSlotIndex);
   if (USE_GROUPS_SEARCH_OPTIMIZED_QUERY) {
      traversal = queryToSearchGoodQualityGroupsOptimized(traversal);
   } else {
      traversal = queryToSearchGoodQualityGroups(traversal);
   }
   traversal = queryToAddDetailsAndFinalSizeToUsersArrays(traversal, GROUP_SLOTS[targetSlotIndex], true);
   return traversal;
}

/**
 * This query returns lists of users arrays where it's users matches between them but they are not very well connected.
 * This search is required to analyze and then create new groups. It's the core feature of the app.
 */
export function queryToGetPossibleBadGroups(targetGroupSlot: GroupSlotConfig): Traversal {
   let traversal = queryToGetUsersAllowedToBeOnBadGroups();
   traversal = queryToSearchBadQualityGroups(traversal);
   traversal = queryToAddDetailsAndFinalSizeToUsersArrays(traversal, targetGroupSlot, true);
   return traversal;
}

// TODO: Aca se tienen que filtrar los usuarios que tienen el slotIndex disponible según el parámetro amount del slot
function queryToGetUsersAllowedToBeOnGoodGroups(targetSlotIndex: number): Traversal {
   return g.V().hasLabel('user');
}

function queryToGetUsersAllowedToBeOnBadGroups(): Traversal {
   return g.V().hasLabel('user');
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
 * To test the query easily:
 * https://gremlify.com/id19z50t41i
 */
function queryToSearchGoodQualityGroups(traversal: Traversal): Traversal {
   return (
      traversal
         .flatMap(
            __.as('appUser')
               .both('Match')
               .flatMap(
                  __.project('triangles', 'squares')
                     .by(
                        // Search triangles: the "matches in common" (matches of the match that are also matches of the user)
                        __.both('Match')
                           .where(__.both('Match').where(P.eq('appUser')))
                           .simplePath()
                           .path()
                           .fold(),
                     )
                     .by(
                        // Search squares: When 2 matches has a match in common and is not a match of the user, a square shape
                        __.both('Match')
                           .where(__.both('Match').where(P.neq('appUser')))
                           .both('Match')
                           .where(__.both('Match').where(P.eq('appUser')))
                           .simplePath()
                           .path()
                           .fold(),
                     )
                     // The triangles groups are more connected than the square groups so they are delivered as independent groups, the square groups are delivered combined with the triangle groups
                     .union(
                        __.select('triangles').unfold(),
                        __.union(
                           __.select('triangles')
                              .unfold()
                              .unfold(),
                           __.select('squares')
                              .unfold()
                              .unfold(),
                        ).fold(),
                     )
                     // We need to order here because dedup() removes duplicates only if the order of the elements in the groups are the same
                     .order(scope.local)
                     .by(t.id)
                     .dedup(scope.local),
               ),
         )
         // Remove groups smaller than the minimum group size and remove duplicates from the list
         .where(__.count(scope.local).is(P.gte(MIN_GROUP_SIZE)))
         .dedup()
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
 * https://gremlify.com/j3hdylnk2vj
 */
// TODO: Agregar un parámetro maxGroupSize y minGroupSize, que solo usuarios con el slot disponible sean buscados
function queryToSearchGoodQualityGroupsOptimized(traversal: Traversal): Traversal {
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

         // Group the figures when they share 2 users in common
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

         // Remove duplicates. Also ordering the users is needed here so dedup recognizes all the groups as the same one
         .map(
            __.select(column.values)
               .unfold()
               .unfold()
               .order()
               .by(t.id)
               .dedup()
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
function queryToSearchBadQualityGroups(traversal: Traversal): Traversal {
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
 * https://gremlify.com/yw7dz6kh1h8
 *
 *
 * @param sizeRestriction Size restriction. This is not to limit the group size, it's for ignoring groups with sizes outside the limits passed.
 * @param returnNames Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsAndFinalSizeToUsersArrays(
   tr: Traversal,
   sizeRestriction?: SizeRestriction,
   returnNames: boolean = false,
): Traversal {
   return tr.map(
      __.where(
         __.count(scope.local)
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

export interface UserAndItsMatches {
   user: string;
   matches: string;
}

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface GroupSlotConfig extends SizeRestriction {
   amount: number;
}
