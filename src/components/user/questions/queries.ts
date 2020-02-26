import * as gremlin from 'gremlin';
import { g } from '../../../common-tools/database-tools/database-manager';
import { GremlinResponse } from '../../../common-tools/database-tools/gremlin-typing-tools';

export async function createQuestions(questionsId: number[]): Promise<GremlinResponse> {
   await g
      .V()
      .hasLabel('question')
      .drop()
      .iterate();

   let query: gremlin.process.GraphTraversal | gremlin.process.GraphTraversalSource = g;

   for (const question of questionsId) {
      query = query.addV('question').property('questionId', question);
   }

   return (query as gremlin.process.GraphTraversal).next();
}
