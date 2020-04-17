import { ExposedUserPropKey, ExposedUserProps } from '../validators/user';

export type UserPropsValueTypes = number | string | boolean | string[];

export interface User {
   userId: string;
   token: string;
   email: string;
   lastLoginDate: number;
   locationLat: number;
   locationLon: number;
   name: string;
   age: number;
   gender: Gender;
   targetAgeMin: number;
   targetAgeMax: number;
   targetDistance: number;
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
   questions?: QuestionResponse[];
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

export interface QuestionResponseParams {
   questionId: number;
   answerId: number;
   useAsFilter?: boolean;
}

export interface UserPostParams {
   token: string;
   props?: ExposedUserProps;
   questions?: QuestionResponseParams[];
}

export interface QuestionData {
   questionId: number;
   text: string;
   affectsCardsGameOrdering: boolean;
   extraText?: string;
   shortVersion?: string;
   answers: QuestionAnswerData[];
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
}

export interface QuestionAnswerData {
   answerId: number;
   text: string;
   extraText?: string;
   shortVersion?: string;
}

export interface QuestionResponse {
   questionId: number;
   answerId: number;
   useAsFilter?: boolean;
   incompatibleAnswers: number[];
}

export interface QuestionInDatabase {
   questionId: number;
}

export interface FileUploadResponse {
   fileNameSmall: string;
   fileNameBig: string;
}

export interface SetAttractionParams {
   token: string;
   attractions: Attraction[];
}

export interface Attraction {
   userId: string;
   attractionType: AttractionType;
}

export enum AttractionType {
   Like = 'Like',
   Dislike = 'Dislike',
}

export const allAttractionTypes: AttractionType[] = Object.values(AttractionType);
