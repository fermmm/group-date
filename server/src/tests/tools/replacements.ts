import { BaseContext } from "koa";
import { DEFAULT_LANGUAGE } from "../../configurations";

export const fakeCtx = {
   header: { "accept-language": DEFAULT_LANGUAGE },
   throw: (code: number, message: string) => console.error(message),
} as BaseContext;

export const fakeCtxMuted = {
   ...fakeCtx,
   throw: (code: number, message: string) => {
      /** Nothing needed here  */
   },
} as BaseContext;
