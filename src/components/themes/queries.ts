import * as moment from 'moment';
import { queryToCreateVerticesFromObjects } from '../../common-tools/database-tools/common-queries';
import { column, g, P, __ } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { Theme, ThemeRelationShip } from '../../shared-tools/endpoints-interfaces/themes';
import { queryToGetUserById, queryToGetUserByToken, hasProfileCompleted } from '../user/queries';

export function queryToCreateThemes(userId: string, themesToCreate: Array<Partial<Theme>>): Traversal {
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

export function queryToGetThemes(filters?: { countryFilter?: string }): Traversal {
   let traversal = g.V().hasLabel('theme');

   if (filters?.countryFilter != null) {
      traversal = traversal.has('country', filters?.countryFilter);
   }

   return traversal;
}

/**
 * @param timeFilter This filter the results by time, for example: pass a week (in seconds) the get the themes created in the last week
 */
export function queryToGetThemesCreatedByUser(token: string, timeFilter?: number): Traversal {
   let traversal: Traversal = queryToGetUserByToken(token).out('createdTheme');

   if (timeFilter != null) {
      traversal = traversal.where(__.values('creationDate').is(P.gte(moment().unix() - timeFilter)));
   }

   return traversal;
}

/**
 * To play with the query:
 * https://gremlify.com/xeqxrbq7uv8
 *
 * @param relation The relation to add or remove
 * @param remove true = adds the relation. false = removes the relation
 */
export function queryToRelateUserWithTheme(
   token: string,
   themesIds: string[],
   relation: ThemeRelationShip,
   remove: boolean,
): Traversal {
   let relationTraversal: Traversal;

   if (remove) {
      relationTraversal = __.inE(relation).where(__.outV().has('token', token)).drop();
   } else {
      relationTraversal = __.coalesce(__.in_(relation).where(P.eq('user')), __.addE(relation).from_('user'));
   }

   return g
      .inject(themesIds)
      .as('themes')
      .union(queryToGetUserByToken(token, __).as('user'))
      .select('themes')
      .unfold()
      .map(
         __.as('themeId')
            .V()
            .hasLabel('theme')
            .has('themeId', __.where(P.eq('themeId')))
            .sideEffect(relationTraversal),
      );
}

/**
 * Receives a theme traversal and adds extra info to the theme objects
 */
export function queryToIncludeExtraInfoInTheme(traversal: Traversal): Traversal {
   return traversal.map(
      __.union(
         __.valueMap().by(__.unfold()),
         __.project('subscribersAmount').by(__.inE('subscribed').count()),
         __.project('blockersAmount').by(__.inE('blocked').count()),
      )
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );
}

export function queryToGetUsersSubscribedToThemes(themesIds: string[]): Traversal {
   return g
      .inject(themesIds)
      .unfold()
      .flatMap(
         __.as('themeId')
            .V()
            .hasLabel('theme')
            .has('themeId', __.where(P.eq('themeId')))
            .in_('subscribed'),
      );
}

export function queryToRemoveThemes(themesIds: string[]): Traversal {
   return g
      .inject(themesIds)
      .unfold()
      .map(
         __.as('themeId')
            .V()
            .hasLabel('theme')
            .has('themeId', __.where(P.eq('themeId')))
            .drop(),
      );
}

/**
 * Only for tests
 */
export function queryToRemoveAllThemes(): Traversal {
   return g.V().hasLabel('theme').drop();
}
