import * as Router from '@koa/router';
import { questionsGet } from './models';

export function questionsRoutes(router: Router): void {
   router.get('/questions', ctx => (ctx.body = questionsGet()));
}
