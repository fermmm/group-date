import * as gremlin from 'gremlin';
import { g } from '../../../common-tools/database-tools/database-manager';
import { GremlinResponse } from '../../../common-tools/database-tools/gremlin-typing-tools';


export async function createQuestions(questionsId: number[]): Promise<GremlinResponse> {
  let query2: gremlin.process.GraphTraversal | gremlin.process.GraphTraversalSource = g;

  for (const question of questionsId) {
    query2 = query2
      .addV('question')
      .property('questionId', question)
  }

  return (query2 as gremlin.process.GraphTraversal).next();
}