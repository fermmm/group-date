// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Koa from 'koa';
import * as router from 'koa-route';
import * as ora from 'ora';
import { databaseIsWorking } from './common-tools/database-tools/database-manager';
import { handshakeRoutes } from './components/handshake/routes';
import { createQuestions } from './components/user/questions/queries';
import { userRoutes } from './components/user/routes';
import { databaseExperiments } from './experiments/database';

(async () => {

   // Koa initialization:
   const app: Koa = new Koa();
   const root = router.all('/', ctx => {
      ctx.body = 'Poly Dates server';
   });
   app.use(root).listen(process.env.PORT);
   ora(`Server running on ${process.env.PORT}!`).succeed();

   // Database initialization:
   await databaseIsWorking();
   createQuestions([0, 1, 2]);

   // Routes:
   handshakeRoutes(app);
   userRoutes(app);

   // Finish:
   ora('Application initialized!').succeed();

   // Other:
   // databaseExperiments();

})();
