import * as Router from '@koa/router';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      // await queryToRemoveUsers();
      ctx.body = `Finished OK`;
   });

   router.get('/testing2', async ctx => {
      ctx.body = `Finished OK`;
   });
}
