import { BaseContext } from 'koa';

export const fakeCtx = {
   throw: (code: number, message: string) => console.error(message),
   t: text => text,
   __getLocale: () => 'en',
   __getLocaleOrigin: () => 'default',
} as BaseContext;

export const fakeCtxMuted = {
   throw: (code: number, message: string) => {
      /** Nothing needed here  */
   },
   t: text => text,
   __getLocale: () => 'en',
   __getLocaleOrigin: () => 'default',
} as BaseContext;
