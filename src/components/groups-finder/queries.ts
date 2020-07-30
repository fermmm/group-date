import { __, column, g, order, P, scope, t } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { MIN_GROUP_SIZE } from '../../configurations';
import { getMatchesSharedWithEachMatchV2 } from './tools/prototypes';

export function getGroupsOfMatchingUsers(): Traversal {
   let traversal = getUsersAllowedToBeOnNewGroups();
   traversal = getMatchesSharedWithEachMatch(traversal);
   // traversal = getMatchesSharedWithEachMatchV2(traversal);
   return traversal;
}

export function getUsersAllowedToBeOnNewGroups(): Traversal {
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
 * Creates groups with matches sharing the same match
 * https://gremlify.com/ja4tpbiyic8
 */
export function getMatchesSharedWithEachMatch(traversal: Traversal): Traversal {
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

         // To log the names instead of the vertex object uncomment this:
         .map(
            __.unfold()
               .values('name')
               .fold(),
         )
   );
}
