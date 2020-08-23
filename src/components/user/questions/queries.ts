import { __, column, g, retryOnError, P } from '../../../common-tools/database-tools/database-manager';
import { Traversal } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { QuestionData, QuestionResponseParams } from '../../../shared-tools/endpoints-interfaces/user';
import { queryToGetUserByToken } from '../queries';
import { getIncompatibleAnswers } from './models';

export async function queryToCreateQuestionsInDatabase(questions: QuestionData[]): Promise<void> {
   return (
      g
         .inject('')
         // Add questions when not present
         .sideEffect(
            __.union(
               ...questions.map(q =>
                  __.coalesce(
                     __.V().has('question', 'questionId', q.questionId),
                     __.addV('question').property('questionId', q.questionId),
                  ),
               ),
            ),
         )
         // Remove from the DB the questions that are not present anymore in the questions list
         .V()
         .hasLabel('question')
         .not(__.has('questionId', P.within(...questions.map(q => q.questionId))))
         .drop()
         .iterate()
   );
}

export async function queryToRespondQuestions(
   token: string,
   questions: QuestionResponseParams[],
): Promise<void> {
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

export function queryToIncludeQuestionsInUserQuery(traversal: Traversal): Traversal {
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

export function queryToGetQuestionsVerticesIds(): Traversal {
   return g
      .V()
      .hasLabel('question')
      .values('questionId');
}
