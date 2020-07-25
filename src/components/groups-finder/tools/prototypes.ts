import { __, column, scope, t } from '../../../common-tools/database-tools/database-manager';
import { Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';

/**
 * This is a more efficient way of finding groups of users connected at a distance of 1.
 * Finds triangles and then connects them.
 */
export function getMatchesSharedWithEachMatchV2(traversal: Traversal): Traversal {
   return (
      traversal
         .as('a')

         // Find all triangles and generate arrays with them:
         .repeat(__.both('Match'))
         .times(2)
         .where(__.both('Match').as('a'))
         .path()
         .from_('a')

         // Remove duplicate users inside the triangle:
         .map(
            __.unfold()
               .limit(3)
               .order()
               .by(t.id)
               .dedup()
               .fold(),
         )
         .dedup()

         // Group the triangles by thier connectable parts
         .group('m')
         .by(__.limit(scope.local, 2))
         .group('m')
         .by(__.tail(scope.local, 2))
         .group('m')
         .by(__.union(__.limit(scope.local, 1), __.tail(scope.local, 1)).fold())

         // Join the triangle groups
         .cap('m')
         .unfold()

         // Remove duplicate groups:
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
