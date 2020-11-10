import { BaseContext } from 'koa';
import { QuestionData, QuestionResponse } from '../../../shared-tools/endpoints-interfaces/user';

export function questionsGet(ctx: BaseContext): QuestionData[] {
   return translateQuestionsText(questions, ctx);
}

const companyQuestion: QuestionData = {
   questionId: 0,
   affectsCardsGameOrdering: false,
   text: 'If you go to a group date from this app, do you plan to go with someone?',
   shortVersion: 'Would go on the date with',
   answers: [
      {
         answerId: 0,
         text: 'Just me',
      },
      {
         answerId: 1,
         text: 'With my couple',
      },
   ],
};

const feminismQuestion: QuestionData = {
   questionId: 1,
   affectsCardsGameOrdering: true,
   text: 'Do you agree with feminism in general?',
   shortVersion: 'Agrees with feminism in general',
   answers: [
      {
         answerId: 0,
         text: 'Yes, I totally agree / I Almost totally agree',
      },
      {
         answerId: 1,
         text: "I Don't agree very much / I do not agree at all",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

const groupSexQuestion: QuestionData = {
   questionId: 2,
   affectsCardsGameOrdering: true,
   text: "The term 'Group sex' what makes you think?",
   shortVersion: 'Thoughts about group sex',
   answers: [
      {
         answerId: 0,
         text: "I don't know / No comments",
      },
      {
         answerId: 1,
         text: "I'm interested",
      },
      {
         answerId: 2,
         text: "I'm not very interested / Zero interest",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [0, 2],
      2: [1],
   },
};

/*
const politicsQuestion: QuestionData = {
   questionId: 3,
   affectsCardsGameOrdering: false,
   text: '¿Qué grupo de posturas políticas preferís?',
   shortVersion: 'Posturas políticas preferidas',
   answers: [
      {
         answerId: 0,
         text: 'Prefiero no decirlo',
      },
      {
         answerId: 1,
         text: 'Libre mercado / Derecha / Otras cercanas',
         shortVersion: 'Libre mercado / Derecha / Otras',
      },
      {
         answerId: 2,
         text: 'Socialismo / Izquierda / Anarquismo / Otras cercanas',
         shortVersion: 'Izquierda / Anarquismo / Otras',
      },
      {
         answerId: 3,
         text: 'Otra',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [2],
      2: [1],
   },
};
*/
export const questions: QuestionData[] = [
   feminismQuestion,
   // politicsQuestion,
   groupSexQuestion,
   companyQuestion,
];

const questionsById: QuestionData[] = createQuestionsByIdArray();
const incompatibleAnswersRecord: Record<number, Record<number, number[]>> = createIncompatibleAnswersRecord();

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
   questions.forEach(question => (result[question.questionId] = question));
   return result;
}

function createIncompatibleAnswersRecord(): Record<number, Record<number, number[]>> {
   const result: Record<number, Record<number, number[]>> = {};
   questions.forEach(question => {
      result[question.questionId] = question.incompatibilitiesBetweenAnswers ?? [];
   });
   return result;
}

function translateQuestionsText(rawQuestions: QuestionData[], ctx: BaseContext): QuestionData[] {
   return rawQuestions.map(q => ({
      ...q,
      text: ctx.t(q.text),
      shortVersion: ctx.t(q.shortVersion),
      answers: q.answers.map(a => ({
         ...a,
         text: ctx.t(a.text),
         shortVersion: ctx.t(a.shortVersion),
      })),
   }));
}
