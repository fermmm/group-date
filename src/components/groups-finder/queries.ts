import { __, column, g, order, P, scope, t } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { MIN_GROUP_SIZE } from '../../configurations';
import { queryToGetPossibleQualityGroupsV2 } from './tools/prototypes';

export function queryToGetPossibleGroups(): Traversal {
   let traversal = queryToGetUsersAllowedToBeOnNewGroups();
   traversal = queryToGetPossibleQualityGroups(traversal);
   // traversal = queryToGetPossibleQualityGroupsV2(traversal);
   return traversal;
}

export function queryToGetUsersAllowedToBeOnNewGroups(): Traversal {
   return g.V().hasLabel('user');
}

/*
export function getMatchesOrderedByConnectionsAmount(traversal: Traversal): Traversal {
   traversal = traversal
      .project('user', 'matches')
      .by()
      .by(
         __.both('Match')
            .as('m')
            .order()
            .by(
               __.bothE('Match')
                  .where(__.bothV().as('m'))
                  .count(),
               order.desc,
            )
            .fold(),
      );

   return traversal;
}
*/

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
 */
export function queryToGetPossibleQualityGroups(traversal: Traversal): Traversal {
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
                     .by('userId')
                     .dedup(scope.local), // TODO: aca hay que ordenar por la cantidad de conexiones que tienen entre si cada miembro del grupo por que despues se viene un limit(), o tambien se podria ordenar por que tanto necesitan estar en un grupo
               ),
         )

         // Remove groups smaller than the minimum group size and remove duplicates from the list
         .where(__.count(scope.local).is(P.gte(MIN_GROUP_SIZE)))
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
