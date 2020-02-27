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
}

export enum Gender {
   Female = 0,
   Male = 1,
   FemaleTrans = 2,
   MaleTrans = 3,
   Other = 4
}

export interface ProfileStatusServerResponse {
   missingUserProps: RequiredUserProp[];
   missingQuestionsId: number[];
}

export interface QuestionData {
   questionId: number;
   text: string;
   extraText?: string;
   shortVersion?: string;
   multipleAnswersAllowed?: boolean;
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