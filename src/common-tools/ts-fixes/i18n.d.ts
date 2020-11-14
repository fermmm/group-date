import * as i18n from 'i18n';

declare module 'i18n' {
   export class I18n {
      /**
       * Get current i18n-node version
       */
      public version: string;

      constructor(options?: ConfigurationOptions);

      /**
       * Configure current i18n instance
       * @param options - configuration options for i18n
       */
      public configure(options: ConfigurationOptions): void;

      /**
       * Initialize i18n middleware for express
       * @param request - Current express request
       * @param response - Current express response
       * @param next - Callback to continue process
       */
      public init(request: Express.Request, response: Express.Response, next?: () => void): void;

      /**
       * Translate the given phrase using locale configuration
       * @param phraseOrOptions - The phrase to translate or options for translation
       * @returns The translated phrase
       */
      public __(phraseOrOptions: string | TranslateOptions, ...replace: string[]): string;
      /**
       * Translate the given phrase using locale configuration
       * @param phraseOrOptions - The phrase to translate or options for translation
       * @param replacements - An object containing replacements
       * @returns The translated phrase
       */
      public __(phraseOrOptions: string | TranslateOptions, replacements: Replacements): string;

      /**
       * Translate with plural condition the given phrase and count using locale configuration
       * @param phrase - Short phrase to be translated. All plural options ("one", "few", other", ...) have to be provided by your translation file
       * @param count - The number which allow to select from plural to singular
       * @returns The translated phrase
       */
      public __n(phrase: string, count: number): string;

      /**
       * Translate with plural condition the given phrase and count using locale configuration
       * @param options - Options for plural translate
       * @param [count] - The number which allow to select from plural to singular
       * @returns The translated phrase
       */
      public __n(options: PluralOptions, count?: number): string;
      /**
       * Translate with plural condition the given phrase and count using locale configuration
       * @param singular - The singular phrase to translate if count is <= 1
       * @param plural - The plural phrase to translate if count is > 1
       * @param count - The number which allow to select from plural to singular
       * @returns The translated phrase
       */
      public __n(singular: string, plural: string, count: number | string): string;

      /**
       * Translate the given phrase using locale configuration and MessageFormat
       * @param phraseOrOptions - The phrase to translate or options for translation
       * @returns The translated phrase
       */
      public __mf(phraseOrOptions: string | TranslateOptions, ...replace: any[]): string;
      /**
       * Translate the given phrase using locale configuration and MessageFormat
       * @param phraseOrOptions - The phrase to translate or options for translation
       * @param replacements - An object containing replacements
       * @returns The translated phrase
       */
      public __mf(phraseOrOptions: string | TranslateOptions, replacements: Replacements): string;

      /**
       * Returns a list of translations for a given phrase in each language.
       * @param phrase - The phrase to get translations in each language
       * @returns The phrase in each language
       */
      public __l(phrase: string): string[];

      /**
       * Returns a hashed list of translations for a given phrase in each language.
       * @param phrase - The phrase to get translations in each language
       * @returns The phrase in each language
       */
      public __h(phrase: string): HashedList[];

      /**
       * Change the current active locale
       * @param locale - The locale to set as default
       */
      public setLocale(locale: string): void;
      /**
       * Change the current active locale for specified response
       * @param response - The request or response to change locale on
       * @param locale - The locale to set as default
       * @param [inheritance=false] - Disables inheritance if true
       */
      public setLocale(
         requestOrResponse: Express.Request | Express.Response,
         locale: string,
         inheritance?: boolean,
      ): void;
      /**
       * Change the current active locale for specified response
       * @param objects - The object(s) to change locale on
       * @param locale - The locale to set as default
       * @param [inheritance=false] - Disables inheritance if true
       */
      // tslint:disable-next-line:unified-signatures
      public setLocale(objects: any | any[], locale: string, inheritance?: boolean): void;

      /**
       * Get the current active locale for specified request
       * @param [request] - The request to get locale for
       * @returns The current locale in request
       */
      public getLocale(request?: Express.Request): string;

      /**
       * Get a list with all configured locales
       */
      public getLocales(): string[];

      /**
       * Get the current global catalog
       * @returns The current global catalog
       */
      public getCatalog(): GlobalCatalog;
      /**
       * Get the catalog for the given locale
       * @param locale - The locale to get catalog for
       * @returns The specified locale catalog
       */
      public getCatalog(locale: string): LocaleCatalog;
      /**
       * Get the current active locale catalog for specified request
       * @param request - The request to get locale catalog for
       * @param [locale] - The locale to get catalog for
       * @returns The current locale catalog for the specified request
       */
      public getCatalog(request: Express.Request, locale?: string): LocaleCatalog;

      /**
       * Override the current request locale by using the query param (?locale=en)
       * @param [request] - The request to override locale for
       */
      public overrideLocaleFromQuery(request?: Express.Request): void;
   }
}
