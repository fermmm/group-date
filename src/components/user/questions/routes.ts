import * as Koa from 'koa';
import * as r from 'koa-route';
import { answerQuestionPost, installQuestionsPost, questionsGet } from './models';

export function questionsRoutes(app: Koa): void {
   app.use(
      r.post(
         '/install-questions',
         async ctx => (ctx.body = await installQuestionsPost()),
      ),
   );

   app.use(
      r.post(
         '/user/answer-question',
         async ctx => (ctx.body = await answerQuestionPost(ctx.request.query, ctx)),
      ),
   );

   app.use(
      r.get(
         '/user/questions',
         async ctx => (ctx.body = await questionsGet(ctx.request.query, ctx)),
      ),
   );
}
