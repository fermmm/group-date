// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Koa from 'koa';
import * as router from 'koa-route';
import { checkDatabaseStatus } from './common-tools/database-tools/database-manager';
import { handshakeRoutes } from './components/handshake/routes';
import { createQuestions } from './components/user/questions/queries';
import { userRoutes } from './components/user/routes';
import { databaseExperiments } from './experiments/database';

// Koa initialization:
const app: Koa = new Koa();
const root = router.all('/', ctx => {
   ctx.body = 'Poly Dates server';
});
app.use(root).listen(process.env.PORT);
console.log(`Server running on ${process.env.PORT}!`);
checkDatabaseStatus();

// App initialization
// TODO: Testear esto
createQuestions([0, 1, 2])

// Routes:
handshakeRoutes(app);
userRoutes(app);

// Other:
// databaseExperiments();
