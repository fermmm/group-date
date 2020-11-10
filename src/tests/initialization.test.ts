import 'jest';
import 'jest-extended';
import {
   queryToCreateQuestionsInDatabase,
   queryToGetQuestionsVerticesIds,
} from '../components/user/questions/queries';
import { QUESTIONS } from '../configurations';

describe('Initialization', () => {
   let questionsIds: number[];
   let questionsInDbIds: number[];

   test('Questions are created in database', async () => {
      await queryToCreateQuestionsInDatabase(QUESTIONS);
      questionsIds = QUESTIONS.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);
   });

   test('Changing the amount of questions changes the database correctly', async () => {
      // Remove the last question
      const removedQuestion = QUESTIONS.splice(QUESTIONS.length - 1, 1)[0];
      await queryToCreateQuestionsInDatabase(QUESTIONS);

      // Test if the question gets removed from the DB
      questionsIds = QUESTIONS.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);

      // Restore questions to not break everything
      QUESTIONS.push(removedQuestion);
      await queryToCreateQuestionsInDatabase(QUESTIONS);

      // Test again if the removed question is re-added also to the DB
      questionsIds = QUESTIONS.map(q => q.questionId);
      questionsInDbIds = (await queryToGetQuestionsVerticesIds().toList()) as number[];
      expect(questionsInDbIds).toIncludeSameMembers(questionsIds);
   });
});
