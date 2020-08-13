import { BaseContext } from 'koa';

export const fakeCtx = {
   throw: (code: number, message: string) => console.error(message),
} as BaseContext;
