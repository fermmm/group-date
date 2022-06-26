import { TokenParameter } from "./common";
import { RequiredUserPropKey } from "../validators/user";
import { TagBasicInfo } from "./tags";
import { ValueOf } from "ts-essentials";
import { UserBanReason } from "./admin";

/**
 * If you want to add a user prop this is the basic todo list:
 *    - Update the prop in this interface
 *    - If you are adding a prop editable by the user add it to the REQUIRED_USER_PROPS_SCHEMA (read the comment on that constant first).
 *    - If you are adding a prop that is type string or any type containing a string which is content can be written by: a user, any human or potential hacker add the prop name to USER_PROPS_TO_ENCODE list.
 *    - If you are adding a prop that should not be visible to other users or hackers make sure you add it to the corresponding prop removal function in security-tools.ts
 *    - Make sure the database queries are updated when using or should use your prop
 *    - Make sure the tests are updated specially the code that generates users with random data.
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
   registrationDate?: number;
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
   imagesAmount?: number;
   notifications: Notification[];
   questionsResponded: AnswerIds[];
   notificationsToken: string;
   tagsSubscribed?: TagBasicInfo[];
   tagsBlocked?: TagBasicInfo[];
   genders: Gender[];
   likesGenders: Gender[];
   demoAccount?: boolean;
   banReasonsAmount?: number;
   banReasons?: UserBanReason[];
   isUnicornHunter?: boolean;
   isUnicornHunterInsisting?: boolean;
   requiredTasks?: RequiredTask[];
   /**
    * Unwanted users are users that are not the target audience of the app.
    * They are not allowed to use some features, like creating new tags.
    * A user becomes unwanted by answering a question that is set as
    * unwantedUserAnswer: true, also by having user properties set like
    * in this object.
    */
   unwantedUser?: boolean;
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
export const TRANS_GENDERS: readonly Gender[] = [Gender.TransgenderWoman, Gender.TransgenderMan];
export const NON_CIS_GENDERS: readonly Gender[] = ALL_GENDERS.filter(gender => !CIS_GENDERS.includes(gender));

export interface ProfileStatusServerResponse {
   missingEditableUserProps: RequiredUserPropKey[];
   notRespondedQuestions: string[];
   user: Partial<User>;
}

export interface UserGetParams extends TokenParameter {
   userId?: string;
}

export interface UserPostParams {
   token: string;
   props?: Partial<User>;
   questionAnswers?: AnswerIds[];
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

export interface SettingsAsQuestionPostParams extends TokenParameter {
   answers: AnswerIds[];
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

export interface BlockOrUnblockUserParams extends TokenParameter {
   targetUserId: string;
}

export interface DeleteAccountPostParams extends TokenParameter {}

export interface DeleteAccountResponse {
   success: boolean;
}

export enum ReportUserType {
   MissingBadPicture = "Bad Photo",
   AggressiveHarassment = "Aggressive/Harassment",
   SexualHarassment = "Sexual Harassment",
   SpammerScammerFake = "Spammer/Scammer/Fake",
   Minor = "Minor (under 18 years old)",
   Offsite = "Offsite behavior: assault / abuse / violence / weapon in a photo",
   Other = "Other",
}

export interface SetSeenPostParams extends TokenParameter {
   setSeenActions: Array<{ targetUserId: string; action: SetSeenAction }>;
}

export enum SetSeenAction {
   RequestRemoveSeen,
   // SetAsSeen, // Not implemented
}

export interface SetSeenResponse {
   success: boolean;
}

export interface RequiredTask {
   taskId: string;
   type: TaskType;
   taskInfo?: string;
}

export interface TaskCompletedPostParams extends TokenParameter {
   taskId: string;
}

export interface TaskCompletedResponse {
   success: true;
}

export enum TaskType {
   ShowRemoveSeenMenu = "ShowRemoveSeenMenu",
}

export interface Question {
   /**
    * You need to create a unique question id for each question. It will be used to reference this question.
    */
   questionId: string;
   /**
    * Text of the question. Localization is already implemented.
    */
   text: string;
   /**
    * Extra text to display after the question.
    */
   extraText?: string;
   answers: QuestionAnswer[];
}

export interface QuestionAnswer {
   /**
    * You need to create a unique id for this answer. It will be used to reference this answer.
    */
   answerId: string;
   /**
    * Text of the answer. Localization is already implemented.
    */
   text: string;
   /**
    * Extra text that is displayed below the answer.
    */
   extraText?: string;
   /**
    * If this parameter is set, one or more tags will be created when the server boots and the user responding
    * this answer will be subscribed to these tag(s).
    */
   subscribesToTags?: AnswerSubscribesToTag[];
   /**
    * If this parameter is set, when the user selects this answer one or more tags will be blocked by the user.
    */
   blocksTags?: AnswerBlocksTag[];
   /**
    * When this parameter is set, one or more user props will be changed when the user selects this answer.
    * WARNING: If the user changes the response of the question this user prop will not be reverted to the original value,
    * you may want the other responses to also set this user prop to avoid unintended effects.
    */
   setsUserProp?: AnswerSetsUserProp[];
   /**
    * When this parameter is set, when the user selects this answer other questions can be automatically answered.
    * Make sure the order of the other questions are placed after this, otherwise the user will be answering the
    * automatic question first and this feature will be not used.
    */
   answersOtherQuestions?: AnswerIds[];
}

export interface AnswerSubscribesToTag {
   /**
    * The id of the tag that will be created and the user subscribed to when answering this.
    */
   tagId: string;
   /**
    * If this param is set with a tag name, the tag will be created if it doesn't exist when booting the server and the user will be subscribed to it when selecting this answer.
    */
   tagName: string;
   /**
    * The category of the tag
    */
   category?: string;
   /**
    * This means that the user never sees the tag is used internally and it's not visible in the client app. Default = false
    */
   tagIsVisible?: boolean;
}

export interface AnswerBlocksTag {
   /**
    * The id of the tag that will be blocked.
    */
   tagId: string;
   /**
    * If this param is set to true the user will be asked if he/she wants to block the tag or not. Default = false
    */
   optional?: boolean;
}

export interface AnswerSetsUserProp<T = boolean> {
   propName: keyof User;
   valueToSet: T;
}

export interface AnswerIds {
   questionId: string;
   answerId: string;
}
