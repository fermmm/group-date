import * as Router from '@koa/router';
import { questionsGet, respondQuestionsPost } from './models';

export function questionsRoutes(router: Router): void {
   router.post('/user/respond-questions', async ctx => (ctx.body = await respondQuestionsPost(ctx.request.body)));
   router.get('/questions', ctx => (ctx.body = questionsGet()));
}
