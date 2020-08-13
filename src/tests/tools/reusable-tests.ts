import 'jest';
import { User, UserPostParams } from '../../shared-tools/endpoints-interfaces/user';

export function fakeUsersMatchesFakeData(fakeUsers: User[], fakeData: Array<Partial<UserPostParams>>): void {
   expect(fakeUsers).toHaveLength(fakeData.length);
   for (let i = 0; i < fakeUsers.length; i++) {
      const user = fakeUsers[i];
      const userData = fakeData[i];
      expect(user.profileCompleted).toBe(true);
      expect(user).toEqual(expect.objectContaining(userData.props));
      for (const userQuestion of user.questions) {
         const dataQuestion = userData.questions.find(q => q.questionId === userQuestion.questionId);
         expect(userQuestion).toEqual(expect.objectContaining(dataQuestion));
      }
   }
}
