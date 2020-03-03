export type RequiredUserProp =
   | 'name'
   | 'birthdate'
   | 'targetAgeMin'
   | 'targetAgeMax'
   | 'pictures'
   | 'dateIdeaName'
   | 'dateIdeaAddress'
   | 'profileDescription'
   | 'locationLat'
   | 'locationLon'
   | 'gender'
   | 'genderPreference';

export interface User {
   id: number;
   token: string;
   email: string;
   locationLat: number;
   locationLon: number;
   name: string;
   birthdate: Date;
   gender: Gender;
   targetAgeMin: number;
   targetAgeMax: number;
   genderPreference: Gender[];
   pictures: string[];
   height?: number;
   dateIdeaName: string;
   dateIdeaAddress: string;
   profileDescription: string;
   profileCompleted: boolean;
   questions?: Array<{ question: QuestionInDatabase; response: QuestionResponseInDatabase }>;
}

export enum Gender {
   Female = 0,
   Male = 1,
   FemaleTrans = 2,
   MaleTrans = 3,
   Other = 4,
}

export interface ProfileStatusServerResponse {
   missingUserProps: RequiredUserProp[];
   missingQuestionsId: number[];
}

export interface RespondQuestionParameters {
   token: string;
   questionId: number;
   answerId: number;
   useAsFilter: boolean;
}

export interface UserSetPropsParameters {
   token: string;
   props: Array<Record<RequiredUserProp, number | string | string[]>>;
}

export interface QuestionData {
   questionId: number;
   text: string;
   extraText?: string;
   shortVersion?: string;
   itsImportantSelectedByDefault?: boolean;
   answers: QuestionAnswerData[];
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
}

export interface QuestionAnswerData {
   answerId: number;
   text: string;
   extraText?: string;
   shortVersion?: string;
}

export interface QuestionResponseInDatabase {
   answerId: number;
   useAsFilter: boolean;
}

export interface QuestionInDatabase {
   questionId: number;
}
