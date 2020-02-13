// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as Koa from 'koa';
import * as router from 'koa-route';
import handshake from './components/handshake/routes';
import { databaseExperiments } from './experiments/database';

const app: Koa = new Koa();

const root = router.all('/', ctx => {
   ctx.body = "Poly Dates server";
});

app
   .use(root)
   .use(handshake)
   .listen(process.env.PORT);

console.log(`Server running on ${process.env.PORT}!`);

// databaseExperiments();
