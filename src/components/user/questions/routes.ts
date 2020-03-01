import * as Koa from 'koa';
import * as r from 'koa-route';
import { questionsGet, respondQuestionPost } from './models';

export function questionsRoutes(app: Koa): void {
   app.use(r.post('/user/respond-question', async ctx => (ctx.body = await respondQuestionPost(ctx.request.query))));
   app.use(r.get('/questions', ctx => (ctx.body = questionsGet())));
}
