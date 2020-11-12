import { BaseContext } from 'koa';
import { QUESTIONS } from '../../../configurations';
import { QuestionData, QuestionResponse } from '../../../shared-tools/endpoints-interfaces/user';
import { setLocaleFrom, t, getLocaleFromHeader } from '../../../common-tools/i18n-tools/i18n-tools';

const questionsById: QuestionData[] = createQuestionsByIdArray();
const incompatibleAnswersRecord: Record<number, Record<number, number[]>> = createIncompatibleAnswersRecord();

export function questionsGet(ctx: BaseContext): QuestionData[] {
   return translateQuestionsText(QUESTIONS, ctx);
}

export function getQuestionDataById(id: number): QuestionData {
   return questionsById[id];
}

export function getQuestionsAffectingCards(questionsToFilter: QuestionResponse[]): QuestionResponse[] {
   const result = [];
   for (const q of questionsToFilter) {
      if (!getQuestionDataById(q.questionId).affectsCardsGameOrdering) {
         continue;
      }
      result.push(q);
   }
   return result;
}

/**
 * You can access an array with the incompatible answers like:
 * getIncompatibleAnswersRecord()[questionId][answerId] has, for example: [2,3,5]
 */
export function getIncompatibleAnswersRecord(): Record<number, Record<number, number[]>> {
   return incompatibleAnswersRecord;
}

export function getIncompatibleAnswers(questionId: number, responseId: number): number[] | null {
   const question: QuestionData = getQuestionDataById(questionId);

   if (question.incompatibilitiesBetweenAnswers == null) {
      return null;
   }

   const result = question.incompatibilitiesBetweenAnswers[responseId];

   if (result == null) {
      return null;
   }

   if (result.length === 0) {
      return null;
   }

   return result;
}

function createQuestionsByIdArray(): QuestionData[] {
   const result: QuestionData[] = [];
   QUESTIONS.forEach(question => (result[question.questionId] = question));
   return result;
}

function createIncompatibleAnswersRecord(): Record<number, Record<number, number[]>> {
   const result: Record<number, Record<number, number[]>> = {};
   QUESTIONS.forEach(question => {
      result[question.questionId] = question.incompatibilitiesBetweenAnswers ?? [];
   });
   return result;
}

function translateQuestionsText(rawQuestions: QuestionData[], ctx: BaseContext): QuestionData[] {
   setLocaleFrom({ ctx });

   return rawQuestions.map(q => ({
      ...q,
      text: t(q.text),
      shortVersion: t(q.shortVersion),
      answers: q.answers.map(a => ({
         ...a,
         text: t(a.text),
         shortVersion: t(a.shortVersion),
      })),
   }));
}
