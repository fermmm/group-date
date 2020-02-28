import * as gremlin from 'gremlin';
import { __, g } from '../../../common-tools/database-tools/database-manager';
import { QuestionData } from '../../../common-tools/endpoints-interfaces/user';

export async function createQuestions(questions: QuestionData[]): Promise<void> {
   const questionsAmount = await g
      .V()
      .hasLabel('question')
      .count()
      .next();

   if(questionsAmount.value !== 0) {
      return Promise.resolve();
   }

   let traversal: gremlin.process.GraphTraversal | gremlin.process.GraphTraversalSource = g;

   for (const question of questions) {
      traversal = traversal.addV('question').property('questionId', question.questionId);
   }

   return (traversal as gremlin.process.GraphTraversal).iterate();
}

export async function respondQuestion(
   questionId: number,
   userId: number,
   responseId: number,
   useAsFilter: boolean,
): Promise<void> {
   return await g
      .V()
      .has('question', 'questionId', Number(questionId))
      .as('q')
      .V(Number(userId))
      .coalesce(
         /*
            The following "where" line is a shortcut for this line:
               __.outE('response').inV().has('question', 'questionId', Number(questionId)),
         */
         __.outE('response').where(__.inV().as('q')),
         __.addE('response')
            .to('q')
            .property('responseId', Number(responseId))
            .property('useAsFilter', Boolean(useAsFilter)),
      )
      .iterate();
}
