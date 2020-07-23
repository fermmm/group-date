import { __, column, scope, t } from '../../../common-tools/database-tools/database-manager';
import { Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';

/**
 * This is a more efficient way of finding groups of users connected at a distance of 1.
 * Finds triangles and then connects them.
 * There is a problem with it: The output is correct in gremlify and not here:
 *    https://gremlify.com/0h8k4hfbpgs
 */
export function getMatchesSharedWithEachMatchV2(traversal: Traversal): Traversal {
   return (
      traversal
         .as('a')

         // Find all triangles:
         .repeat(__.both())
         .times(2)
         .simplePath()
         .where(__.both().as('a'))
         .path()

         // Connect triangles when they have users in common
         .map(
            __.unfold()
               .limit(3)
               .order()
               .by(t.id)
               .dedup()
               .fold(),
         )
         .dedup()
         .group('m')
         .by(__.limit(scope.local, 2))
         .group('m')
         .by(__.tail(scope.local, 2))
         .group('m')
         .by(__.union(__.limit(scope.local, 1), __.tail(scope.local, 1)).fold())
         .cap('m')
         .unfold()

         // Remove duplicates:
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

         // To log the names instead of the vertex object uncomment this:
         .map(
            __.unfold()
               .values('name')
               .fold(),
         )
   );
}
