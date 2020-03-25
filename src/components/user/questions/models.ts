import { QuestionData } from '../../../shared-tools/endpoints-interfaces/user';

export function questionsGet(): QuestionData[] {
   return questions;
}

const companyQuestion: QuestionData = {
   questionId: 0,
   text: '¿Irías acompañade a las citas grupales de esta app?',
   shortVersion: 'Iría a la cita con',
   answers: [
      {
         answerId: 0,
         text: 'Iría sole',
      },
      {
         answerId: 1,
         text: 'Iría en pareja',
      },
   ],
};

const sexIntentionsQuestion: QuestionData = {
   questionId: 1,
   text: '¿Estás abierte a relacionarte sexualmente?',
   shortVersion: 'Abierte a relacionarse sexualmente',
   answers: [
      {
         answerId: 0,
         text: 'Si',
      },
      {
         answerId: 1,
         text: 'No, no quiero relacionarme sexualmente',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

const feminismQuestion: QuestionData = {
   questionId: 2,
   text: '¿Estás de acuerdo con el feminismo en general?',
   extraText: 'O con algún movimiento feminista',
   shortVersion: 'Está de acuerdo con algún feminismo',
   answers: [
      {
         answerId: 0,
         text: 'Si, muy de acuerdo',
      },
      {
         answerId: 1,
         text: 'Podría ser en alguna cosa, pero en general no',
      },
      {
         answerId: 2,
         text: 'No sé nada sobre el tema',
      },
      {
         answerId: 3,
         text: 'No me interesa / No me parece importante',
      },
      {
         answerId: 4,
         text: 'No estoy de acuerdo con el feminismo para nada',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1, 2, 3, 4],
      1: [0],
      2: [0],
      3: [0],
      4: [0],
   },
};

const groupSexQuestion: QuestionData = {
   questionId: 3,
   text: '¿Qué pensas del sexo grupal?',
   shortVersion: 'Su opinión sobre el sexo grupal',
   answers: [
      {
         answerId: 0,
         text: 'No lo se / Prefiero no opinar',
      },
      {
         answerId: 1,
         text: 'No me molesta la idea / Me gustaría probar',
      },
      {
         answerId: 2,
         text: 'Me gustó, lo haría de nuevo',
      },
      {
         answerId: 3,
         text: 'No tengo interés',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [3],
      2: [3],
      3: [1, 2],
   },
};

const smokeQuestion: QuestionData = {
   questionId: 4,
   text: '¿Fumas? (tabaco)',
   shortVersion: 'Fuma',
   answers: [
      {
         answerId: 0,
         text: 'No',
      },
      {
         answerId: 1,
         text: 'Muy poco',
      },
      {
         answerId: 2,
         text: 'Si',
      },
   ],
};

const politicsQuestion: QuestionData = {
   questionId: 5,
   text: '¿Cuál es tu postura política?',
   extraText: 'Puede ser incómoda la pregunta pero es importante para la mayoría de personas consultadas',
   shortVersion: 'Su postura política',
   itsImportantSelectedByDefault: true,
   answers: [
      {
         answerId: 0,
         text: 'No es un tema para hablar en una cita',
      },
      {
         answerId: 1,
         text: 'Libre mercado / Centro-derecha / Derecha / Otras cercanas',
         shortVersion: 'Libre mercado / Derecha / Otras',
      },
      {
         answerId: 2,
         text: 'Socialismo / Centro-izquierda / Izquierda / Anarquismo / Otras cercanas',
         shortVersion: 'Izquierda / Otras',
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
   companyQuestion,
   sexIntentionsQuestion,
   feminismQuestion,
   groupSexQuestion,
   smokeQuestion,
   politicsQuestion,
];
