// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Router from '@koa/router';
import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as mount from 'koa-mount';
import * as ratelimit from 'koa-ratelimit';
import * as serve from 'koa-static';
import * as locales from 'koa-locales';
import * as ora from 'ora';
import { waitForDatabase } from './common-tools/database-tools/database-manager';
import { rateLimiterConfig } from './common-tools/security-tools/security-tools';
import { adminRoutes } from './components/admin/routes';
import { initializeCardsGame } from './components/cards-game/models';
import { cardsGameRoutes } from './components/cards-game/routes';
import { initializeGroupsFinder } from './components/groups-finder/models';
import { initializeGroups } from './components/groups/models';
import { groupsRoutes } from './components/groups/routes';
import { handshakeRoutes } from './components/handshake/routes';
import { testingRoutes } from './components/testing/routes';
import { themesRoutes } from './components/themes/routes';
import { initializeUsers } from './components/user/models';
import { userRoutes } from './components/user/routes';

(async () => {
   // Koa initialization:
   const app: Koa = new Koa();
   const router = new Router();
   router.get('/', (ctx, next) => {
      ctx.body = 'Poly Dates server';
   });

   // Database initialization:
   await waitForDatabase();

   // Initializers that contains scheduled tasks and other initialization stuff
   initializeUsers();
   initializeGroups();
   initializeCardsGame();
   initializeGroupsFinder();

   // Routes:
   handshakeRoutes(router);
   userRoutes(router);
   cardsGameRoutes(router);
   groupsRoutes(router);
   themesRoutes(router);
   adminRoutes(router);
   testingRoutes(router);

   // Koa middlewares:
   const a = app
      .use(ratelimit(rateLimiterConfig))
      .use(koaBody({ parsedMethods: ['GET', 'POST'] }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(mount('/images', serve('./uploads/')))
      .listen(process.env.PORT);

   locales(app, {
      defaultLocale: 'en',
      functionName: 't',
   });

   // Final messages
   ora('Application initialized!').succeed();
   ora(`Server running on ${process.env.PORT}!`).succeed();
})();
