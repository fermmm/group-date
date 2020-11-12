import * as i18n from 'i18n';
import { BaseContext } from 'koa';
import { DEFAULT_LANGUAGE } from '../../configurations';
import { User } from '../../shared-tools/endpoints-interfaces/user';

/**
 * Returns a translation to the provided string
 */
// @ts-ignore
export const t: typeof i18n.__ = (...args) => i18n.__(...args);

/**
 * Sets the translator language, optionally from ctx or from the user. If it's not found sets the
 * language to the default.
 */
export function setLocaleFrom(sources: { ctx?: BaseContext; user?: Partial<User> }): void {
   if (sources.ctx != null) {
      i18n.setLocale(getLocaleFromHeader(sources.ctx));
      return;
   }
   if (sources.user != null) {
      i18n.setLocale(sources.user.language ?? DEFAULT_LANGUAGE);
      return;
   }

   i18n.setLocale(DEFAULT_LANGUAGE);
}

/**
 * Retrieves the language from the header parameters and if the language is not present returns the default.
 */
export function getLocaleFromHeader(ctx: BaseContext): string {
   return ctx.header['accept-language'] ?? DEFAULT_LANGUAGE;
}
