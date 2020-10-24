import { queryToCreateVerticesFromObjects } from '../../common-tools/database-tools/common-queries';
import { g, P, __ } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { Theme } from '../../shared-tools/endpoints-interfaces/themes';
import { queryToGetUserById } from '../user/queries';
import * as moment from 'moment';

export function queryToCreateThemes(userId: string, themesToCreate: Theme[]): Traversal {
   return queryToCreateVerticesFromObjects(themesToCreate, 'theme')
      .fold()
      .as('t')
      .union(queryToGetUserById(userId, __).as('user'))
      .select('t')
      .unfold()
      .sideEffect(
         __.map(
            // Create an edge to keep track of who created the theme
            __.sideEffect(__.addE('createdTheme').from_('user')),
         ),
      );
}

/**
 *
 * @param timeFilter This filter the results by time, for example: pass a week (in seconds) the get the themes created in the last week
 */
export function queryToGetThemesCreatedByUser(userId: string, timeFilter?: number): Traversal {
   let traversal: Traversal = queryToGetUserById(userId).out('createdTheme');

   if (timeFilter != null) {
      traversal = traversal.where(__.values('creationDate').is(P.gte(moment().unix() - timeFilter)));
   }

   return traversal;
}
