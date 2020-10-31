import { ValidationError } from 'fastest-validator';
import { BaseContext } from 'koa';
import * as moment from 'moment';
import {
   Theme,
   ThemeCreateParams,
   ThemeGetParams,
   BasicThemeParams,
} from '../../shared-tools/endpoints-interfaces/themes';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { validateThemeProps } from '../../shared-tools/validators/themes';
import { retrieveFullyRegisteredUser } from '../user/models';
import { generateId } from '../../common-tools/string-tools/string-tools';
import {
   queryToCreateThemes,
   queryToGetThemesCreatedByUser,
   queryToGetThemes,
   queryToRelateUserWithTheme,
   queryToRemoveThemes,
} from './queries';
import { THEMES_PER_TIME_FRAME, THEME_CREATION_TIME_FRAME } from '../../configurations';
import { fromQueryToTheme, fromQueryToThemeList } from './tools/data-conversion';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';

export async function createThemePost(params: ThemeCreateParams, ctx: BaseContext): Promise<Theme> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (params.global && !user.isAdmin) {
      ctx.throw(400, 'Only admin users can create global themes');
      return;
   }

   if (params.country && !user.isAdmin) {
      ctx.throw(400, 'Only admin users can set the theme country');
      return;
   }

   const validationResult: true | ValidationError[] = validateThemeProps(params);
   if (validationResult !== true) {
      ctx.throw(400, JSON.stringify(validationResult));
      return;
   }

   const themesCreatedByUserTraversal: Traversal = queryToGetThemesCreatedByUser(
      user.token,
      THEME_CREATION_TIME_FRAME,
   );
   const themesCreatedByUser: Theme[] = await fromQueryToThemeList(themesCreatedByUserTraversal);

   if (themesCreatedByUser.length >= THEMES_PER_TIME_FRAME && !user.isAdmin) {
      const remaining = moment
         .duration(getRemainingTimeToCreateNewTheme(themesCreatedByUser), 'seconds')
         .locale('en')
         .humanize();

      ctx.throw(
         400,
         `Sorry you created too many themes in a short period of time. Try again in ${remaining}. The themes should be created by many different users, although you can send us a message and we can evaluate adding the themes`,
      );
      return;
   }

   const userThemesTraversal: Traversal = queryToGetThemes({ countryFilter: params.country ?? user.country });
   const userThemes: Theme[] = await fromQueryToThemeList(userThemesTraversal);
   const matchingTheme: Theme = userThemes.find(t => t.name.toLowerCase() === params.name.toLowerCase());

   if (matchingTheme != null) {
      ctx.throw(400, 'A theme with the same name already exists in your country');
      return;
   }

   const themeToCreate: Partial<Theme> = {
      themeId: generateId(),
      name: params.name,
      category: params.category.toLowerCase(),
      country: params.country ?? user.country,
      creationDate: moment().unix(),
      global: params.global ?? false,
   };

   return await fromQueryToTheme(queryToCreateThemes(user.userId, [themeToCreate]), false);
}

export async function themesGet(params: ThemeGetParams, ctx: BaseContext): Promise<Theme[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (user.isAdmin) {
      // In the query the countryFilter must be null to return all app themes
      if (params.countryFilter === 'all') {
         params.countryFilter = null;
      }
      return await fromQueryToThemeList(queryToGetThemes({ countryFilter: params.countryFilter }), true);
   }

   return await fromQueryToThemeList(queryToGetThemes({ countryFilter: user.country }), true);
}

export async function themesCreatedByUserGet(token: string) {
   return await fromQueryToThemeList(queryToGetThemesCreatedByUser(token), true);
}

export async function subscribeToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, 'subscribed', false),
      false,
   );
}

export async function blockThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, 'blocked', false),
      false,
   );
}

export async function removeSubscriptionToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, 'subscribed', true),
      false,
   );
}

export async function removeBlockToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, 'blocked', true),
      false,
   );
}

export async function removeThemesPost(params: BasicThemeParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   if (!user.isAdmin) {
      const themesCreatedByUser: Theme[] = await themesCreatedByUserGet(params.token);

      for (const t of params.themeIds) {
         const themeFound = themesCreatedByUser.find(ut => ut.themeId === t);
         if (themeFound == null) {
            ctx.throw(400, 'Only admin users can remove themes created by anyone');
            return;
         }
         if (themeFound.subscribersAmount > 0 || themeFound.blockersAmount > 0) {
            ctx.throw(
               400,
               `Sorry, ${
                  themeFound.subscribersAmount + themeFound.blockersAmount
               } users have interacted with your theme, it cannot be removed anymore.`,
            );
            return;
         }
      }
   }

   await queryToRemoveThemes(params.themeIds).iterate();
}

/**
 * This is currently being used to clean tests only
 */
export async function removeAllThemesCreatedBy(users: User[]): Promise<void> {
   const result: Theme[] = [];
   for (const user of users) {
      result.push(...(await themesCreatedByUserGet(user.token)));
   }
   await queryToRemoveThemes(result.map(t => t.themeId)).iterate();
}

function getRemainingTimeToCreateNewTheme(themes: Theme[]): number {
   const oldestTheme: Theme = themes.reduce((result, theme) => {
      // Theme is not inside the creation time frame
      if (theme.creationDate < moment().unix() - THEME_CREATION_TIME_FRAME) {
         return result;
      }

      if (result == null) {
         return theme;
      }

      // Theme is older than current
      if (theme.creationDate < result.creationDate) {
         return theme;
      }

      return result;
   }, null);

   let secondsLeft: number = 0;
   if (oldestTheme != null) {
      secondsLeft = THEME_CREATION_TIME_FRAME - (moment().unix() - oldestTheme.creationDate);
   }

   return secondsLeft;
}
