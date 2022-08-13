import { ChatMessage, TokenParameter } from "./common";
import { NotificationChannelId, NotificationContent, User } from "./user";

export interface AdminProtectionParams {
   user: string;
   password: string;
   hash?: string;
}

export interface AdminChatPostParams extends TokenParameter {
   messageText: string;
   targetUserId?: string;
}

export interface AdminChatGetParams extends TokenParameter {
   targetUserId?: string;
}

export interface AdminChatGetAllParams extends TokenParameter {
   excludeRespondedByAdmin?: boolean;
}

export interface ChatWithAdmins {
   messages: ChatMessage[];
   adminHasResponded: boolean;
   lastMessageDate: number;
   nonAdminUser: User;
}

export interface AdminConvertPostParams extends TokenParameter {
   targetUserToken?: string;
}

export interface AdminLogGetParams extends AdminProtectionParams {
   logId: string;
}

export interface AdminDeleteLogEntryParams extends AdminProtectionParams {
   logId: string;
   entryId: string;
}

export interface AdminGroupGetParams extends AdminProtectionParams {
   groupId: string;
}

export interface UsageReport {
   total: number;
   withPhoto: number;
   couples: number;
   unwanted: number;
   unwantedWomen: number;
   wanted: number;
   mens: number;
   women: number;
   usersWith2Matches: number;
   wantedUsersInAGroup: number;
   unwantedUsersInAGroup: number;
   amountOfGroups: number;
   totalOpenGroups: number;
   openGroupsBySlot: number[];
   timeSpentOnReportMs: number;
}

export interface VisualizerQueryParams extends AdminProtectionParams {
   query: string;
   nodeLimit: number;
}

export interface AdminQueryParams extends AdminProtectionParams {
   query: string;
}

export interface AdminQueryResponse<QueryResult = any, Attributes = {}> {
   _items: QueryResult[];
   attributes: Attributes;
   length: number;
}

export interface ImportDatabasePostParams extends AdminProtectionParams {
   filePaths: string[];
   format: DatabaseContentFileFormat;
}

export enum DatabaseContentFileFormat {
   NeptuneCsv,
   GraphMl,
   GremlinQuery,
}

export interface ExportDatabaseGetParams extends AdminProtectionParams {}
export interface ExportDatabaseResponse {
   commandResponse: string;
   folder: string;
}

export interface CredentialsValidationResult {
   isValid: boolean;
   error?: string;
}

export interface AdminNotificationPostParams extends AdminProtectionParams {
   filters: AdminNotificationFilter;
   onlyReturnUsersAmount?: boolean;
   notificationContent?: NotificationContent;
   sendEmailNotification?: boolean;
   channelId?: NotificationChannelId;
   logResult?: boolean;
}

export interface AdminNotificationStatusGet extends AdminProtectionParams {
   ticketId: string;
}

export interface AdminNotificationFilter {
   usersEmail?: string[];
}

export interface AdminCommandPostParams extends AdminProtectionParams {
   command: string;
}

export interface AdminCodePostParams extends AdminProtectionParams {
   code: string;
}

export interface SendEmailPostParams extends AdminProtectionParams {
   to: string;
   subject: string;
   text: string;
}

export enum UserBanReason {
   Spam = "User is doing spam",
   UnsupportedUsageIntention = "User wants to use the app with a not supported intention",
   NotInterestedInTheApp = "User showed no interest about participating in what the app proposes but created a profile anyway",
   NonEthicalUsage = "User is doing non-ethical usage of the app",
   BanRequestedByAuthority = "Google or Apple requested the user to be banned",
   BadQualityProfile = "The profile lacks basic information like a useful image. Profile quality is too bad.",
}

export interface BanUserPostParams extends AdminProtectionParams {
   userId: string;
   reason: UserBanReason;
}

export interface RemoveBanFromUserPostParams extends AdminProtectionParams {
   userId: string;
   reason: UserBanReason;
}

export interface RemoveAllBanReasonsFromUserPostParams extends AdminProtectionParams {
   userId: string;
}

export interface LogFileListResponse {
   logId: string;
   category: string;
   description: string;
}

export interface LogResponse {
   id: string;
   category: string;
   description: string;
   separator: string;
   log: string;
}
