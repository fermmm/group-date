import { EditableUserProp } from '../validators/user';

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
   missingEditableUserProps: EditableUserProp[];
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
   props: Record<EditableUserProp, number | string>;
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
   fileName: string;
}
