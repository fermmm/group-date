import { EditableUserPropKey, EditableUserProps } from '../validators/user';
import { ThemeBasicInfo } from './themes';

export type UserPropsValueTypes = number | string | boolean | string[];

/**
 * If you want to add or remove a "user editable user prop" this is the basic todo list:
 *    - Update, add or remove the prop in this interface
 *    - Make sure the database queries are updated when using or should use your prop
 *    - If the prop is editable by the user search editableUserPropsSchema constant and update it.
 *    - Make sure the tests are updated specially the code that generates users with random data.
 */
export interface User {
   userId: string;
   token: string;
   email: string;
   notifications: Notification[];
   lastLoginDate: number;
   locationLat: number;
   locationLon: number;
   cityName: string;
   country: string;
   language: string;
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
   dateIdea: string;
   profileDescription: string;
   profileCompleted: boolean;
   isAdmin?: boolean;
   sendNewUsersNotification: number;
   lastGroupJoinedDate: number;
   questions?: QuestionResponse[];
   themesSubscribed?: ThemeBasicInfo[];
   themesBlocked?: ThemeBasicInfo[];
}

export enum Gender {
   Woman = 'Woman',
   Man = 'Man',
   TransgenderWoman = 'TransgenderWoman',
   TransgenderMan = 'TransgenderMan',
   Other = 'Other',
}

export interface ProfileStatusServerResponse {
   missingEditableUserProps: EditableUserPropKey[];
   missingQuestionsId: number[];
}

export interface QuestionResponseParams {
   questionId: number;
   answerId: number;
   useAsFilter?: boolean;
}

export interface UserPostParams {
   token: string;
   props?: EditableUserProps;
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

export enum MatchType {
   Like = 'Match',
   Dislike = 'SeenMatch',
}

export interface Notification {
   notificationId: string;
   idForReplacement?: string;
   date: number;
   type: NotificationType;
   title: string;
   text: string;
   targetId?: string;
}

export enum NotificationType {
   TextOnly,
   Group,
   Chat,
   ContactChat,
   FacebookEvent,
   CardsGame,
   About,
}

export const allAttractionTypes: AttractionType[] = Object.values(AttractionType);
export const allMatchTypes: MatchType[] = Object.values(MatchType);
