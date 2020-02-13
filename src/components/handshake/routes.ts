import * as router from 'koa-route';
import { serverMessage, serverOperating, validateVersion } from './models';

export default router.post('/handshake', ctx => {
   serverOperating(ctx);
   validateVersion(ctx);
   serverMessage(ctx);
});
