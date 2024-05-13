import { BaseContext } from "koa";
import * as i18n from "i18n";
import { DEFAULT_LANGUAGE } from "../../configurations";
import { User } from "../../shared-tools/endpoints-interfaces/user";

/**
 * Returns a translation to the provided string
 */
export const t = (
   phraseOrOptions: string | i18n.TranslateOptions,
   sources: LocaleConfigurationSources,
   ...replace: string[]
): string => {
   i18n.setLocale(findLocaleIn(sources));
   return i18n.__(phraseOrOptions, ...replace);
};

/**
 * Returns the user language, optionally from ctx or from the user. If it's not found returns the
 * default language from DEFAULT_LANGUAGE.
 */
export function findLocaleIn(sources: LocaleConfigurationSources): string {
   let locale: string;

   if (sources?.user?.language != null) {
      locale = sources.user.language;
   } else if (sources?.ctx != null) {
      locale = getLocaleFromHeader(sources.ctx);
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

   return ctx.header["accept-language"] ?? DEFAULT_LANGUAGE;
}

export interface LocaleConfigurationSources {
   ctx?: BaseContext;
   user?: Partial<User>;
}
