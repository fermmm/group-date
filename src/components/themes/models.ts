import { ValidationError } from 'fastest-validator';
import { BaseContext } from 'koa';
import { Theme, ThemeCreateParams } from '../../shared-tools/endpoints-interfaces/themes';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { validateThemeProps } from '../../shared-tools/validators/themes';
import { retrieveFullyRegisteredUser } from '../user/models';
import { generateId } from '../../common-tools/string-tools/string-tools';
import * as moment from 'moment';
import { queryToCreateThemes, queryToGetThemesCreatedByUser } from './queries';
import { THEMES_PER_TIME_FRAME, THEME_CREATION_TIME_FRAME } from '../../configurations';

export async function createThemePost(params: ThemeCreateParams, ctx: BaseContext): Promise<Theme[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (params.global && !user.isAdmin) {
      ctx.throw(400, 'Only admin users can create global themes');
   }

   const validationResult: true | ValidationError[] = validateThemeProps(params);
   if (validationResult !== true) {
      ctx.throw(400, JSON.stringify(validationResult));
   }

   const recentlyCreatedThemes = await queryToGetThemesCreatedByUser(
      user.userId,
      THEME_CREATION_TIME_FRAME,
   ).toList();

   if (recentlyCreatedThemes.length >= THEMES_PER_TIME_FRAME) {
      // TODO: Calcular cuanto tiempo falta para que el usuario pueda crear otro theme y devolver
      ctx.throw(400, `Too much themes created in a shot period of time`);
   }

   const themeToCreate: Theme = {
      themeId: generateId(),
      name: params.name,
      category: params.category,
      locationLat: user.locationLat,
      locationLon: user.locationLon,
      creationDate: moment().unix(),
      global: params.global ?? false,
   };

   return ((await queryToCreateThemes(user.userId, [themeToCreate]).toList()) as unknown) as Theme[];
}
