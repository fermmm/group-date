import * as express from 'express';

export function serverOperating(req: express.Request, res: express.Response, next: express.NextFunction) {
   const response: ServerHandshakeResponse = {
      ...res.locals,
      serverOperating: false,
      serverMessage: "Server is unfinished"
   }
   res.locals = response;
   next();
}

export function validateVersion(req: express.Request, res: express.Response, next: express.NextFunction) {
   console.log(`${JSON.stringify(req.query)}`);
   const response: ServerHandshakeResponse = {
      ...res.locals,
      versionCompatible: true,
   }
   res.locals = response;
   next();
}

export interface ServerHandshakeResponse {
   versionCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}