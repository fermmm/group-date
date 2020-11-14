import { BaseContext } from 'koa';
import { DEFAULT_LANGUAGE, I18N } from '../../configurations';
import { User } from '../../shared-tools/endpoints-interfaces/user';

/**
 * Returns a translation to the provided string
 */
export const t = (
   phraseOrOptions: string | i18n.TranslateOptions,
   sources: LocaleConfigurationSources,
   ...replace: string[]
): string => {
   I18N.setLocale(findLocaleIn(sources));
   return I18N.__(phraseOrOptions, ...replace);
};

/**
 * Sets the translator language, optionally from ctx or from the user. If it's not found sets the
 * language to the default.
 */
function findLocaleIn(sources: LocaleConfigurationSources): string {
   let locale: string;

   if (sources.ctx != null) {
      locale = getLocaleFromHeader(sources.ctx);
   } else if (sources.user != null) {
      locale = sources.user.language;
   } else {
      locale = DEFAULT_LANGUAGE;
   }

   return locale;
}

/**
 * Retrieves the language from the header parameters and if the language is not present returns the default.
 */
export function getLocaleFromHeader(ctx: BaseContext): string {
   if (ctx.header == null) {
      return DEFAULT_LANGUAGE;
   }

   return ctx.header['accept-language'] ?? DEFAULT_LANGUAGE;
}

export interface LocaleConfigurationSources {
   ctx?: BaseContext;
   user?: Partial<User>;
}
