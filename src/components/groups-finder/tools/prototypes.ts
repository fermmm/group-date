import { __, column, P, scope, t } from '../../../common-tools/database-tools/database-manager';
import { Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';

/**
 * This query finds users that matches together forming a group, it's the core of the app.
 * Returns groups of matching users.
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
 */
export function queryToGetPossibleQualityGroupsV2(traversal: Traversal): Traversal {
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

         // This part builds the format of the final output, at this point each group is a list of users and we need to
         // convert that into an object that contains the user and who that users matches with within the group.
         .map(
            __.as('g')
               .unfold()
               .map(
                  __.project('user', 'matches')
                     .by(
                        __.values('name'), // Uncommenting this line can be useful for debugging
                     )
                     .by(
                        __.as('u')
                           .select('g')
                           .unfold()
                           .where(__.both('Match').where(P.eq('u'))) // Get the matches of the user within the group
                           .values('name') // Changing "userId" by "name" here is useful for debugging
                           .fold(),
                     ),
               )
               .fold(),
         )
   );
}
