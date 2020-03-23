// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Router from '@koa/router';
import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as mount from 'koa-mount';
import * as ratelimit from 'koa-ratelimit';
import * as serve from 'koa-static';
import * as ora from 'ora';
import { waitForDatabase } from './common-tools/database-tools/database-manager';
import { createFolderOnRoot } from './common-tools/files-tools/files-tools';
import { rateLimitterConfig } from './common-tools/security-tools/security-tools';
import { handshakeRoutes } from './components/handshake/routes';
import { questions } from './components/user/questions/models';
import { createQuestions } from './components/user/questions/queries';
import { userRoutes } from './components/user/routes';
import { databaseExperiments } from './experiments/database';
import { testingRoutes } from './components/testing/routes';

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router();
   router.get('/', (ctx, next) => {
      ctx.body = 'Poly Dates server';
   });
   createFolderOnRoot('uploads');

   // Database initialization:
   await waitForDatabase();
   createQuestions(questions);

   // Routes:
   handshakeRoutes(router);
   userRoutes(router);
   testingRoutes(router);

   // Other:
   // databaseExperiments();

   // App uses:
   app.use(ratelimit(rateLimitterConfig))
      .use(koaBody({ parsedMethods: ['GET', 'POST'] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(mount('/images', serve('./uploads/')))
      .listen(process.env.PORT);

   ora('Application initialized!').succeed();
   ora(`Server running on ${process.env.PORT}!`).succeed();
})();
