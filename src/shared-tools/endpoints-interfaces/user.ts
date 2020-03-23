import { ExposedUserPropKey, ExposedUserProps } from '../validators/user';

export type UserPropsValueTypes = number | string | boolean | string[];

export interface User {
   id: number;
   token: string;
   email: string;
   locationLat: number;
   locationLon: number;
   name: string;
   age: number;
   gender: Gender;
   targetAgeMin: number;
   targetAgeMax: number;
   likesWoman: boolean;
   likesMan: boolean;
   likesWomanTrans: boolean;
   likesManTrans: boolean;
   likesOtherGenders: boolean;
   pictures: string[];
   height?: number;
   dateIdeaName: string;
   dateIdeaAddress: string;
   profileDescription: string;
   profileCompleted: boolean;
   questions?: Array<{ question: QuestionInDatabase; response: QuestionResponseInDatabase }>;
}

export enum Gender {
   Woman = 'Woman',
   Man = 'Man',
   TransgenderWoman = 'TransgenderWoman',
   TransgenderMan = 'TransgenderMan',
   Other = 'Other',
}

export interface ProfileStatusServerResponse {
   missingEditableUserProps: ExposedUserPropKey[];
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
   props: ExposedUserProps;
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

export interface FileUploadResponse {
   fileNameSmall: string;
   fileNameBig: string;
}
