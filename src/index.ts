// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Router from '@koa/router';
import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as mount from 'koa-mount';
import * as serve from 'koa-static';
import * as ora from 'ora';
import { databaseIsWorking } from './common-tools/database-tools/database-manager';
import { createFolderOnRoot } from './common-tools/files-tools/files-tools';
import { handshakeRoutes } from './components/handshake/routes';
import { questions } from './components/user/questions/models';
import { createQuestions } from './components/user/questions/queries';
import { userRoutes } from './components/user/routes';
import { databaseExperiments } from './experiments/database';

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router();
   router.get('/', (ctx, next) => {
      ctx.body = 'Poly Dates server';
   });
   createFolderOnRoot('uploads');

   // Database initialization:
   await databaseIsWorking();
   createQuestions(questions);

   // Routes:
   handshakeRoutes(router);
   userRoutes(router);

   // Other:
   // databaseExperiments();

   // App uses:
   app.use(koaBody({ parsedMethods: ['GET', 'POST'] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(mount('/images', serve('./uploads/')))
      .listen(process.env.PORT);

   ora('Application initialized!').succeed();
   ora(`Server running on ${process.env.PORT}!`).succeed();
})();
