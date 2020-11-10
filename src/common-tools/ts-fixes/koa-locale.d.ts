import { BaseContext } from 'koa';

declare module 'koa' {
   export interface BaseContext {
      t: (
         text: string,
         ...moreProps: Array<string | number | boolean | string[] | number[] | boolean[]>
      ) => string;
      __getLocale: () => string;
      __getLocaleOrigin: () => string;
   }
}
