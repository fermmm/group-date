import * as Koa from 'koa';

export interface HttpRequestResponse<T> {
   success: boolean;
   error?: HttpRequestError;
   content?: T;
}

export interface HttpRequestError {
   code: number;
   message: string;
}
