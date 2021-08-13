import { TokenParameter } from "./common";
import { RequiredUserPropKey, EditableUserProps } from "../validators/user";
import { TagBasicInfo } from "./tags";
import { ValueOf } from "ts-essentials";

/**
 * If you want to add or remove a "user editable user prop" this is the basic todo list:
 *    - Update, add or remove the prop in this interface
 *    - Make sure the database queries are updated when using or should use your prop
 *    - If the prop is editable by the user search editableUserPropsSchema constant and update it.
 *    - Make sure the tests are updated specially the code that generates users with random data.
 *    - If the prop should not be visible to other users or hackers make sure you add it to security-tools.ts
 */
export interface User {
   userId: string;
   token: string;
   email: string;
   isCoupleProfile: boolean;
   lastLoginDate: number;
   locationLat: number;
   locationLon: number;
   cityName: string;
   country: string;
   language: string;
   name: string;
   birthDate: number;
   targetAgeMin: number;
   targetAgeMax: number;
   targetDistance: number;
   images: string[];
   height?: number;
   dateIdea: string;
   profileDescription: string;
   profileCompleted: boolean;
   isAdmin?: boolean;
   sendNewUsersNotification: number;
   lastGroupJoinedDate: number;
   notifications: Notification[];
   questionsShowed: string[];
   targetGenderIsSelected: boolean;
   notificationsToken: string;
   tagsSubscribed?: TagBasicInfo[];
   tagsBlocked?: TagBasicInfo[];
}

export type UserPropsValueTypes = ValueOf<User>;

/**
 * The order here in this enum determines the order the genders will appear in some places
 */
export enum Gender {
   Woman = "Woman",
   Man = "Man",

   Agender = "Agender",
   Androgynous = "Androgynous",
   Bigender = "Bigender",
   Genderfluid = "Genderfluid",
   Genderqueer = "Genderqueer",
   GenderNonConforming = "Gender Nonconforming",
   Hijra = "Hijra",
   Intersex = "Intersex",
   NonBinary = "Non binary",
   Other = "Other",
   Pangender = "Pangender",
   TransgenderWoman = "Transgender Woman",
   TransgenderMan = "Transgender Man",
}

export type CisGender = Gender.Woman | Gender.Man;
export type NonCisGender = Exclude<Gender, CisGender>;

export const ALL_GENDERS: readonly Gender[] = Object.values(Gender);
export const CIS_GENDERS: readonly Gender[] = [Gender.Woman, Gender.Man];
export const NON_CIS_GENDERS: readonly Gender[] = ALL_GENDERS.filter(gender => !CIS_GENDERS.includes(gender));

export interface ProfileStatusServerResponse {
   missingEditableUserProps: RequiredUserPropKey[];
   notShowedTagQuestions: string[];
   genderIsSelected: boolean;
   targetGenderIsSelected: boolean;
   user: Partial<User>;
}

export interface UserGetParams extends TokenParameter {
   userId?: string;
}

export interface UserPostParams {
   token: string;
   props?: EditableUserProps;
   genders?: Gender[];
   targetGenders?: Gender[];
   updateProfileCompletedProp?: boolean;
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
   Like = "Like",
   Dislike = "Dislike",
}

export enum MatchType {
   Like = "Match",
   Dislike = "SeenMatch",
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

export type NotificationContent = Omit<Notification, "notificationId" | "date">;

export enum NotificationType {
   TextOnly,
   Group,
   Chat,
   ContactChat,
   NearbyPartyOrEvent,
   CardsGame,
   About,
}

export type UserPropsAsQuestionsTypes = boolean;

export interface UserPropAsQuestion<T = UserPropsAsQuestionsTypes> {
   text: string;
   answers: Array<UserPropAsQuestionAnswer<T>>;
   multipleAnswersAllowed?: boolean;
   shortVersion?: string;
}

export interface UserPropAsQuestionAnswer<T = UserPropsAsQuestionsTypes> {
   propName: keyof User;
   text: string;
   shortVersion?: string;
   value: T;
}

export const allAttractionTypes: AttractionType[] = Object.values(AttractionType);
export const allMatchTypes: MatchType[] = Object.values(MatchType);

export enum NotificationChannelId {
   Default = "default",
   ChatMessages = "chat",
   Events = "events",
   NewUsers = "newUsers",
   DateReminders = "dateReminders",
}

export interface NotificationChannelInfo {
   id: NotificationChannelId;
   name: string;
}

export interface NotificationData {
   targetId: string;
   type: NotificationType;
   notificationId: string;
}

export interface ReportUserPostParams extends TokenParameter {
   reportedUserId: string;
   reportType: ReportUserType;
   notes?: string;
}

export enum ReportUserType {
   NonEthical = "non-ethical",
   MissingPicture = "missing-picture",
}
