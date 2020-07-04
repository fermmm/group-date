import { QuestionData } from '../../../shared-tools/endpoints-interfaces/user';

export function questionsGet(): QuestionData[] {
   return questions;
}

const companyQuestion: QuestionData = {
   questionId: 0,
   affectsCardsGameOrdering: false,
   text: '¿Pensás ir acompañadx a las citas grupales de esta app?',
   shortVersion: 'Iría a la cita con',
   answers: [
      {
         answerId: 0,
         text: 'Iría solx',
      },
      {
         answerId: 1,
         text: 'Iría con mi pareja',
      },
   ],
};

const feminismQuestion: QuestionData = {
   questionId: 1,
   affectsCardsGameOrdering: true,
   text: '¿Estás de acuerdo con el feminismo en general?',
   shortVersion: 'Está de acuerdo con el feminismo en general',
   answers: [
      {
         answerId: 0,
         text: 'Si, muy de acuerdo / En casi todo',
      },
      {
         answerId: 1,
         text: 'No tan de acuerdo / Nada de acuerdo',
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
   text: '¿Qué pensás del sexo grupal?',
   shortVersion: 'Su opinión sobre el sexo grupal',
   answers: [
      {
         answerId: 0,
         text: 'No lo se / Prefiero no opinar',
      },
      {
         answerId: 1,
         text: 'Me interesa',
      },
      {
         answerId: 2,
         text: 'No tengo mucho interés / No me interesa',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [0, 2],
      2: [1],
   },
};

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

export const questions: QuestionData[] = [
   feminismQuestion,
   politicsQuestion,
   groupSexQuestion,
   companyQuestion,
];
const questionsById: QuestionData[] = createQuestionsByIdArray();

export function getQuestionDataById(id: number): QuestionData {
   return questionsById[id];
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
