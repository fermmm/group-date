import { User } from '../endpoints-interfaces/user';

export function ammountOfMatchingResponses(user1: User, user2: User): number {
   let result: number = 0;

   if ((user1.questions?.length ?? 0) === 0) {
      return result;
   }

   if ((user2.questions?.length ?? 0) === 0) {
      return result;
   }

   for (const user1Question of user1.questions) {
      const user2Question = user2.questions.find(q => q.questionId === user1Question.questionId);
      if (user1Question.answerId === user2Question.answerId) {
         result++;
      }
   }

   return result;
}
