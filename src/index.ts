// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Router from '@koa/router';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as ora from 'ora';
import { databaseIsWorking } from './common-tools/database-tools/database-manager';
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

   // Database initialization:
   await databaseIsWorking();
   createQuestions(questions);

   // Routes:
   handshakeRoutes(router);
   userRoutes(router);

   // Other:
   // databaseExperiments();

   // Finish:
   app.use(bodyParser())
      .use(router.routes())
      .use(router.allowedMethods())
      .listen(process.env.PORT);
   ora(`Server running on ${process.env.PORT}!`).succeed();
   ora('Application initialized!').succeed();
})();
