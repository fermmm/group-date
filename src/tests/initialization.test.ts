import 'jest';
import 'jest-extended';
import { questions } from '../components/user/questions/models';
import {
   queryToCreateQuestionsInDatabase,
   queryToGetQuestionsVerticesIds,
} from '../components/user/questions/queries';

describe('Initialization', () => {
   let questionsIds: number[];
   let questionsInDbIds: number[];

   test('Questions are created in database', async () => {
      await queryToCreateQuestionsInDatabase(questions);
      questionsIds = questions.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);
   });

   test('Changing the amount of questions changes the database correctly', async () => {
      // Remove the last question
      const removedQuestion = questions.splice(questions.length - 1, 1)[0];
      await queryToCreateQuestionsInDatabase(questions);

      // Test if the question gets removed from the DB
      questionsIds = questions.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);

      // Restore questions to not break everything
      questions.push(removedQuestion);
      await queryToCreateQuestionsInDatabase(questions);

      // Test again if the removed question is re-added also to the DB
      questionsIds = questions.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);
   });
});
