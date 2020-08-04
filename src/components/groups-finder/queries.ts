import { __, column, g, order, P, scope, t } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { MIN_GROUP_SIZE } from '../../configurations';
import { queryToGetPossibleQualityGroupsV2 } from './tools/prototypes';

export function queryToGetPossibleGroups(): Traversal {
   let traversal = queryToGetUsersAllowedToBeOnNewGroups();
   traversal = queryToGetPossibleQualityGroups(traversal);
   // traversal = queryToGetPossibleQualityGroupsV2(traversal);
   traversal = queryToAddDetailsToUsersArrays(traversal, true);
   return traversal;
}

export function queryToGetUsersAllowedToBeOnNewGroups(): Traversal {
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
   );
}

/**
 * Receives a traversal with a list of users arrays and for each user adds it's matches within the group. This extra
 * info is required by the group quality analyzer
 * @param returnNamesInsteadOfIds Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsToUsersArrays(tr: Traversal, returnNamesInsteadOfIds: boolean = false): Traversal {
   return tr.map(
      __.as('g')
         .unfold()
         .map(
            __.project('user', 'matches')
               .by(__.values(returnNamesInsteadOfIds ? 'name' : 'userId'))
               .by(
                  __.as('u')
                     .select('g')
                     .unfold()
                     .where(__.both('Match').where(P.eq('u'))) // Get the matches of the user within the group
                     .values(returnNamesInsteadOfIds ? 'name' : 'userId')
                     .fold(),
               ),
         )
         .fold(),
   );
}
