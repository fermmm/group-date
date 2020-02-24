import * as gremlin from 'gremlin';
import { g } from '../../../common-tools/database-tools/database-manager';
import { GremlinResponse } from '../../../common-tools/database-tools/gremlin-typing-tools';


export async function createQuestions(questionsId: number[]): Promise<GremlinResponse> {
  const q: gremlin.process.GraphTraversalSource = g;
  let query2: gremlin.process.GraphTraversal = null;

  // TODO: esto no andaria
  for (const question of questionsId) {
    query2 = q
      .addV('question')
      .property('questionId', question)
  }

  return query2.next();
}