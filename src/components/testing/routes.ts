import * as Router from '@koa/router';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      ctx.body = `Finished`;
   });
}
