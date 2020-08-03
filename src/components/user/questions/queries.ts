import { __, column, g, retryOnError } from '../../../common-tools/database-tools/database-manager';
import { Traversal, VertexProperty } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { QuestionData, QuestionResponseParams } from '../../../shared-tools/endpoints-interfaces/user';
import { queryToGetUserByToken } from '../../common/queries';
import { getIncompatibleAnswers } from './models';

export async function createQuestions(questions: QuestionData[]): Promise<void> {
   let traversal: Traversal = g;

   /**
    * Add question to the database from the questions list provided (only when it does not
    * exist already)
    */

   for (const question of questions) {
      traversal = traversal
         .V()
         .has('question', 'questionId', Number(question.questionId))
         .fold()
         .coalesce(__.unfold(), __.addV('question').property('questionId', Number(question.questionId)));
   }
   await (traversal as Traversal).iterate();

   /**
    * Remove questions in the database that are not present in the questions list provided
    */

   let surplusQuestions = (await g
      .V()
      .hasLabel('question')
      .properties('questionId')
      .toList()) as VertexProperty[];

   surplusQuestions = surplusQuestions.filter(q => questions.find(v => v.questionId === q.value) == null);

   if (surplusQuestions.length === 0) {
      return Promise.resolve();
   }

   let traversal2: Traversal = g;
   for (const question of surplusQuestions) {
      traversal2 = traversal2
         .V()
         .has('question', 'questionId', Number(question.value))
         .aggregate('x')
         .cap('x');
   }
   await traversal2
      .unfold()
      .drop()
      .iterate();

   return Promise.resolve();
}

export async function respondQuestions(token: string, questions: QuestionResponseParams[]): Promise<void> {
   let query: Traversal = queryToGetUserByToken(token).as('user');

   for (const question of questions) {
      query = query
         .V()
         .has('question', 'questionId', Number(question.questionId))
         .as('question')
         .sideEffect(
            __.inE('response')
               .where(__.outV().as('user'))
               .drop(),
         )
         .addE('response')
         .from_('user')
         .property('questionId', Number(question.questionId))
         .property('answerId', Number(question.answerId))
         .property('useAsFilter', Boolean(question.useAsFilter))
         .property(
            'incompatibleAnswers',
            `[${getIncompatibleAnswers(question.questionId, question.answerId) || ''}]`,
         );
   }

   return retryOnError(() => query.iterate());
}

export function addQuestionsRespondedToUserQuery(traversal: Traversal): Traversal {
   return traversal.map(
      __.union(
         __.valueMap().by(__.unfold()),
         __.project('questions').by(
            __.outE('response')
               .valueMap()
               .by(__.unfold())
               .fold(),
         ),
      )
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );
}
