import * as gremlin from 'gremlin';
import { g } from '../../../common-tools/database-tools/database-manager';
import { GremlinResponse } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { QuestionData } from '../../../common-tools/endpoints-interfaces/user';

export async function createQuestions(questions: QuestionData[]): Promise<GremlinResponse> {
   await g
      .V()
      .hasLabel('question')
      .drop()
      .iterate();

   let query: gremlin.process.GraphTraversal | gremlin.process.GraphTraversalSource = g;

   for (const question of questions) {
      query = query.addV('question').property('questionId', question.questionId);
   }

   return (query as gremlin.process.GraphTraversal).next();
}

export async function respondQuestion(
   questionId: number,
   userId: number,
   responseId: number,
   useAsFilter: boolean,
): Promise<void> {
   return await g
      .addE('response')
      .from_(userId)
      .to(questionId)
      .property('responseId', responseId)
      .property('useAsFilter', useAsFilter)
      .iterate();
}
