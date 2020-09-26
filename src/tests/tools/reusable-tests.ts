import 'jest';
import { firstBy } from 'thenby';
import { DeepPartial } from 'ts-essentials';
import { objectsContentIsEqual } from '../../common-tools/js-tools/js-tools';
import { QuestionResponse, User } from '../../shared-tools/endpoints-interfaces/user';

/**
 * Checks if the users created contains the information that was passed to create them. Also checks that both
 * arrays have the same size, so no user is missing.
 */
export function createdUsersMatchesFakeData(
   createdUsers: User[],
   dataUsed: Array<DeepPartial<User>>,
   alsoCheckOrder: boolean = false,
): void {
   expect(createdUsers).toHaveLength(dataUsed.length);

   if (!alsoCheckOrder) {
      createdUsers = [...createdUsers];
      dataUsed = [...dataUsed];
      const cmp = new Intl.Collator().compare;
      createdUsers.sort(
         firstBy<User>('userId', { cmp }),
      );
      dataUsed.sort(
         firstBy<User>('userId', { cmp }),
      );
   }

   for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const userData = dataUsed[i];
      expect(usersDataMatches(user, userData)).toBeTrue();
      expect(usersQuestionsMatches(user.questions, userData.questions)).toBeTrue();
   }
}

export function usersDataMatches(user1: DeepPartial<User>, user2: DeepPartial<User>): boolean {
   return objectsContentIsEqual({ ...user1, questions: null }, { ...user2, questions: null });
}

export function usersQuestionsMatches(
   user1Questions: Array<Partial<QuestionResponse>>,
   user2Questions: Array<Partial<QuestionResponse>>,
): boolean {
   const user1Q = [...user1Questions];
   const user2Q = [...user2Questions];
   user1Q.sort(firstBy<Partial<QuestionResponse>>(q => q.questionId));
   user2Q.sort(firstBy<Partial<QuestionResponse>>(q => q.questionId));
   for (let i = 0; i < user1Q.length; i++) {
      const q1 = user1Q[i];
      const q2 = user2Q[i];
      if (q1.questionId !== q2.questionId) {
         return false;
      }
      if (q1.answerId !== q2.answerId) {
         return false;
      }
      if (q1.useAsFilter !== q2.useAsFilter) {
         return false;
      }
   }

   return true;
}
