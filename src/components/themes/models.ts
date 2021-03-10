import { ValidationError } from "fastest-validator";
import { BaseContext } from "koa";
import * as moment from "moment";
import {
   APP_AUTHORED_THEMES,
   APP_AUTHORED_THEMES_AS_QUESTIONS,
   THEMES_PER_TIME_FRAME,
   THEME_CREATION_TIME_FRAME,
} from "../../configurations";
import { fromQueryToTheme, fromQueryToThemeList } from "./tools/data-conversion";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { __ } from "../../common-tools/database-tools/database-manager";
import { t, LocaleConfigurationSources } from "../../common-tools/i18n-tools/i18n-tools";
import {
   Theme,
   ThemeCreateParams,
   ThemeGetParams,
   BasicThemeParams,
   ThemesAsQuestion,
} from "../../shared-tools/endpoints-interfaces/themes";
import { User } from "../../shared-tools/endpoints-interfaces/user";
import { validateThemeProps } from "../../shared-tools/validators/themes";
import { retrieveFullyRegisteredUser } from "../user/models";
import { generateId } from "../../common-tools/string-tools/string-tools";
import {
   queryToCreateThemes,
   queryToGetThemesCreatedByUser,
   queryToGetThemes,
   queryToRelateUserWithTheme,
   queryToRemoveThemes,
} from "./queries";

export async function initializeThemes(): Promise<void> {
   await creteAppAuthoredThemes();
}

export async function createThemePost(params: ThemeCreateParams, ctx: BaseContext): Promise<Theme> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (params.global && !user.isAdmin) {
      ctx.throw(400, t("Only admin users can create global themes", { user }));
      return;
   }

   if (params.country && !user.isAdmin) {
      ctx.throw(400, t("Only admin users can set the theme country", { user }));
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
         .duration(getRemainingTimeToCreateNewTheme(themesCreatedByUser), "seconds")
         .locale(user.language)
         .humanize();

      ctx.throw(400, t("Sorry you created too many themes", { user }, remaining));
      return;
   }

   const userThemesTraversal: Traversal = queryToGetThemes({ countryFilter: params.country ?? user.country });
   const userThemes: Theme[] = await fromQueryToThemeList(userThemesTraversal);
   const matchingTheme: Theme = userThemes.find(
      theme => theme.name.toLowerCase() === params.name.toLowerCase(),
   );

   if (matchingTheme != null) {
      ctx.throw(400, t("A theme with the same name already exists in your country", { user }));
      return;
   }

   const themeToCreate: Partial<Theme> = {
      themeId: generateId(),
      name: params.name,
      category: params.category.toLowerCase(),
      country: params.country ?? user.country,
      creationDate: moment().unix(),
      lastInteractionDate: moment().unix(),
      global: params.global ?? false,
   };

   return await fromQueryToTheme(queryToCreateThemes(user.userId, [themeToCreate]), false);
}

export async function themesGet(params: ThemeGetParams, ctx: BaseContext): Promise<Theme[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);
   let result: Theme[];

   if (!user.isAdmin) {
      result = await fromQueryToThemeList(queryToGetThemes({ countryFilter: user.country }), true);
   } else {
      // In the query the countryFilter must be null to return all app themes
      if (params.countryFilter === "all") {
         params.countryFilter = null;
      }
      result = await fromQueryToThemeList(queryToGetThemes({ countryFilter: params.countryFilter }), true);
   }

   result = translateAppAuthoredThemes(result, { user });
   return result;
}

export function appAuthoredThemesAsQuestionsGet(ctx: BaseContext): ThemesAsQuestion[] {
   return translateAppAuthoredThemesAsQuestions(APP_AUTHORED_THEMES_AS_QUESTIONS, ctx);
}

export async function themesCreatedByUserGet(token: string) {
   return await fromQueryToThemeList(queryToGetThemesCreatedByUser(token), true);
}

export async function subscribeToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, "subscribed", false),
      false,
   );
}

export async function blockThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, "blocked", false),
      false,
   );
}

export async function removeSubscriptionToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, "subscribed", true),
      false,
   );
}

export async function removeBlockToThemePost(params: BasicThemeParams): Promise<Theme[]> {
   return await fromQueryToThemeList(
      queryToRelateUserWithTheme(params.token, params.themeIds, "blocked", true),
      false,
   );
}

export async function removeThemesPost(params: BasicThemeParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      const themesCreatedByUser: Theme[] = await themesCreatedByUserGet(params.token);

      for (const theme of params.themeIds) {
         const themeFound = themesCreatedByUser.find(ut => ut.themeId === theme);
         if (themeFound == null) {
            ctx.throw(400, t("Only admin users can remove themes created by anyone", { user }));
            return;
         }
         if (themeFound.subscribersAmount > 0 || themeFound.blockersAmount > 0) {
            ctx.throw(
               400,
               t(
                  "Sorry, %s users have interacted with your theme, it cannot be removed anymore",
                  { user },
                  String(themeFound.subscribersAmount + themeFound.blockersAmount),
               ),
            );
            return;
         }
      }
   }

   await queryToRemoveThemes(params.themeIds).iterate();
}

export async function creteAppAuthoredThemes() {
   // Create raw app authored themes
   const themesReady: Array<Partial<Theme>> = APP_AUTHORED_THEMES.map(theme => ({
      ...theme,
      country: "all",
      creationDate: moment().unix(),
      lastInteractionDate: moment().unix(),
      global: true,
   }));

   // Crete app authored themes that are saved as questions
   themesReady.push(
      ...APP_AUTHORED_THEMES_AS_QUESTIONS.map(question =>
         question.answers.map(answer => ({
            themeId: answer.themeId,
            category: answer.category,
            name: answer.themeName,
            country: "all",
            creationDate: moment().unix(),
            lastInteractionDate: moment().unix(),
            global: true,
         })),
      ).flat(),
   );

   await fromQueryToTheme(queryToCreateThemes(null, themesReady), false);
}

/**
 * This is currently being used to clean tests only
 */
export async function removeAllThemesCreatedBy(users: User[]): Promise<void> {
   const result: Theme[] = [];
   for (const user of users) {
      result.push(...(await themesCreatedByUserGet(user.token)));
   }
   await queryToRemoveThemes(result.map(theme => theme.themeId)).iterate();
}

export function getNotShowedQuestionIds(user: Partial<User>): string[] {
   const result: string[] = [];

   APP_AUTHORED_THEMES_AS_QUESTIONS.forEach(themeQ => {
      const foundInUser = user.questionsShowed?.find(q => q === themeQ.questionId);
      if (foundInUser == null) {
         result.push(themeQ.questionId);
      }
   });
   return result;
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

/**
 * App authored themes are global, this means any country will see the themes, so translation is needed.
 */
function translateAppAuthoredThemes(themes: Theme[], localeSource: LocaleConfigurationSources): Theme[] {
   const appAuthoredIds: Set<string> = getAppAuthoredQuestionsIdsAsSet();

   return themes.map(theme => {
      if (!appAuthoredIds.has(theme.themeId)) {
         return theme;
      }

      return {
         ...theme,
         category: t(theme.category, localeSource),
         name: t(theme.name, localeSource),
      };
   });
}

function translateAppAuthoredThemesAsQuestions(
   rawQuestions: ThemesAsQuestion[],
   ctx: BaseContext,
): ThemesAsQuestion[] {
   return rawQuestions.map(q => ({
      ...q,
      text: t(q.text, { ctx }),
      extraText: q.extraText != null ? t(q.extraText, { ctx }) : null,
      answers: q.answers.map(a => ({
         ...a,
         text: t(a.text, { ctx }),
         themeName: t(a.themeName, { ctx }),
      })),
   }));
}

let catchedAppAuthoredQuestions = null;
export function getAppAuthoredQuestionsIdsAsSet(): Set<string> {
   if (catchedAppAuthoredQuestions == null) {
      const result = new Set<string>();
      APP_AUTHORED_THEMES.forEach(q => result.add(q.themeId));
      APP_AUTHORED_THEMES_AS_QUESTIONS.forEach(q => q.answers.forEach(a => result.add(a.themeId)));
      catchedAppAuthoredQuestions = result;
   }
   return catchedAppAuthoredQuestions;
}
