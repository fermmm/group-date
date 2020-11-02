import { getQuestionDataById } from '../../components/user/questions/models';
import { User } from '../endpoints-interfaces/user';

/**
 * Returns the amount of questions responded exactly in the same way by 2 users.
 *
 * @param onlyCardOrderingQuestions Default = true Only count questions that has affectsCardsGameOrdering = true
 */
export function amountOfMatchingResponses(
   user1: User,
   user2: User,
   settings: { onlyCardOrderingQuestions: boolean },
): number {
   let result: number = 0;

   if ((user1.questions?.length ?? 0) === 0) {
      return result;
   }

   if ((user2.questions?.length ?? 0) === 0) {
      return result;
   }

   for (const user1Question of user1.questions) {
      if (
         settings.onlyCardOrderingQuestions &&
         !getQuestionDataById(user1Question.questionId).affectsCardsGameOrdering
      ) {
         continue;
      }

      const user2Question = user2.questions.find(q => q.questionId === user1Question.questionId);
      if (user1Question.answerId === user2Question.answerId) {
         result++;
      }
   }

   return result;
}
