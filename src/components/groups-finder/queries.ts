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
 */
export function getMatchesSharedWithEachMatch(traversal: Traversal): Traversal {
   return (
      traversal
         .flatMap(
            __.as('appUser')
               .both('Match')
               .flatMap(
                  __.union(
                     // Search the "matches in common" (matches of the match that are also matches of the user)
                     __.both('Match')
                        .where(P.neq('appUser'))
                        .where(__.both('Match').where(P.eq('appUser'))),

                     // The search above doesn't include the 2 users that are being checked against and they are also part of the group, so we add them in this union
                     __.identity(),
                     __.select('appUser'),
                  )
                     // We need to order here because dedup() removes duplicates if the order of the elements in the groups are the same
                     .order()
                     .by('userId') // TODO: aca hay que ordenar por la cantidad de conexiones que tienen entre si cada miembro del grupo por que despues se viene un limit(), o tambien se podria ordenar por que tanto necesitan estar en un grupo
                     .fold(),
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
