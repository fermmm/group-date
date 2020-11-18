import { BaseContext } from "koa";

export const fakeCtx = {
   throw: (code: number, message: string) => console.error(message),
} as BaseContext;

export const fakeCtxMuted = {
   throw: (code: number, message: string) => {
      /** Nothing needed here  */
   },
} as BaseContext;
