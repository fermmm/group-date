import { __, column, g, order, P, scope } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';

export function getAllPossibleGroups(): Traversal {
   let traversal = getUsersAllowedToBeOnNewGroups();
   traversal = getMatchesSharedWithEachMatch(traversal);
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
 * TODO: Que pasa si no devuelve nada en algun lado? no detendra toda la busqueda?
 */
export function getMatchesSharedWithEachMatch(traversal: Traversal): Traversal {
   return (
      traversal
         .project('userGroups')
         .by(
            __.as('appUser')
               .both('Match')
               .project('group')
               .by(
                  __.union(
                     // Search the "matches in common" (matches of the match that are also matches of the user)
                     __.both('Match')
                        .where(P.neq('appUser'))
                        .where(__.both('Match').where(P.eq('appUser'))),

                     // The search above doesn't include the 2 users that are being checked against and they are also part of the group, so we add them in a union
                     __.select('appUserMatch'),
                     __.select('appUser'),
                  )
                     // We need to order here because dedup() removes duplicates if the order of the elements in the groups are the same
                     .order()
                     .by('userId') // TODO: aca hay que ordenar por la cantidad de conexiones que tienen entre si cada miembro del grupo por que despues se viene un limit(), o tambien se podria ordenar por que tanto necesitan estar en un grupo
                     .values('name')
                     .fold(),
               )
               .select(column.values)
               .unfold(),
         )
         .select(column.values)
         .unfold()

         // Remove empty arrays  and duplicates from the list
         .where(__.count(scope.local).is(P.gt(2)))
         .dedup()
   );
}
