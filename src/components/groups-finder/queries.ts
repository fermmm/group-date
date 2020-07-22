import { gremlinArrayMap } from '../../common-tools/database-tools/common-queries';
import { __, column, g, order, P } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';

export function getAllPossibleGroups(): Traversal {
   let traversal = getUsersAllowedToBeOnNewGroups();
   // TODO: Aca ordenar los matches no seria necesario por que los grupos se forman con muchos usuarios y luego se ordenan y luego se limitan
   traversal = gremlinArrayMap(traversal, getMatchesOrderedByConnectionsAmount(__));
   traversal = gremlinArrayMap(traversal, getMatchesSharedWithEachMatch(__));

   // Remove duplicates and empty arrays from the list
   traversal = traversal.dedup().where(__.unfold());
   return traversal;
}

export function getUsersAllowedToBeOnNewGroups(): Traversal {
   return g.V().hasLabel('user');
}

/**
 * Receives a traversal with a user and returns their "matches" (when they like each other).
 * The results are ordered by the amount of matches between them, the first users will be those who have
 * more matches with the other ones.
 *
 * @param traversal A traversal with a list of users
 */
// TODO: Si un usuario no tiene amigos que devuelve esto, se ejecuta lo que venga despues de algo que devuelve vacio?
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

/**
 * TODO: Que pasa si no devuelve nada en algun lado? no detendra toda la busqueda?
 */
export function getMatchesSharedWithEachMatch(traversal: Traversal): Traversal {
   // Save the user as "u" and then select the matches list
   traversal = traversal
      .as('t')
      .select('user')
      .as('appUser')
      .select('t')
      .select('matches')
      .unfold();

   let forEachMatch: Traversal = __.as('match');

   // Search the "matches in common" (matches of the match that are also matches of the user)
   forEachMatch = forEachMatch
      .both('Match')
      .where(P.neq('appUser'))
      .where(__.both('Match').where(P.eq('appUser')));

   // If the matches in common has a minimum amount create a group adding the matches in common and the match
   forEachMatch = forEachMatch.union(__.select('match'), __.select('appUser'), __.identity());

   forEachMatch = forEachMatch
      .unfold()
      .order()
      .by('userId'); // TODO: aca hay que ordenar por la cantidad de conexiones que tienen entre si cada miembro del grupo por que despues se viene un limit(), o tambien se podria ordenar por que tanto necesitan estar en un grupo

   // For testing:
   forEachMatch = forEachMatch.values('name');

   return gremlinArrayMap(traversal, forEachMatch)
      .dedup()
      .fold();
}
