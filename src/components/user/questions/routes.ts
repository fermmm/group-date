import * as Router from '@koa/router';
import * as Koa from 'koa';
import { questionsGet, respondQuestionPost } from './models';

export function questionsRoutes(router: Router): void {
   router.post('/user/respond-question', async ctx => (ctx.body = await respondQuestionPost(ctx.request.body)));
   router.get('/questions', ctx => (ctx.body = questionsGet()));
}
