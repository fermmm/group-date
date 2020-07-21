import { gremlinArrayMap } from '../../common-tools/database-tools/common-queries';
import { __, column, g, order, P } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';

export function getAllPossibleGroups(): Traversal {
   let traversal = getUsersAllowedToBeOnNewGroups();
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
 * TODO: Aca ya tengo que evaluar si cuando se llega al maximo de usuarios se formaron los mejores grupos posibles
 * gracias a haber ordenado los amigos con el la funcion de arriba
 * TODO: Que pasa si no devuelve nada en algun lado? no detendra toda la busqueda?
 */
export function getMatchesSharedWithEachMatch(traversal: Traversal): Traversal {
   // Save the user as "u" and then select the matches list
   traversal = traversal
      .as('t')
      .select('user')
      .as('u')
      .select('t')
      .select('matches')
      .unfold();

   let forEachMatch: Traversal = __.as('match');

   // Search the "matches in common" (matches of the match that are also matches of the user)
   forEachMatch = forEachMatch
      .both('Match')
      .where(__.bothE('Match').where(__.bothV().as('u')))
      .as('search');

   forEachMatch = forEachMatch.select('match');

   // If the matches in common has a minimum amount create a group adding the matches in common and the match
   forEachMatch = forEachMatch.choose(
      __.both('Match')
         .where(__.bothE('Match').where(__.bothV().as('u'))) // TODO: Esto esta 2 veces
         .count()
         .is(P.lt(2)),
      __.select('__nothing__'),
      __.project('match', 'friendsInCommon')
         .by(__.fold())
         .by(__.select('search').fold())
         .select(column.values)
         .unfold()
         .unfold(),
   );

   forEachMatch = forEachMatch
      .unfold()
      .order()
      .by('userId'); // TODO: Aca hay que ver que orden le pongo por que despues le voy a poner un limit(Max_group_size) y hay que ver quienes quedan afuera

   // For testing:
   forEachMatch = forEachMatch.values('name');

   return gremlinArrayMap(traversal, forEachMatch)
      .dedup()
      .fold();
}
