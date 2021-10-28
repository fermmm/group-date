import { ChatMessage, TokenParameter } from "./common";
import { NotificationChannelId, NotificationContent, User } from "./user";

export interface AdminProtectionParams {
   user: string;
   password: string;
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
   fileName: string;
}

export interface UsageReport {
   amountOfUsers: number;
   incompleteUsers: number;
   amountOfGroups: number;
   totalOpenGroups: number;
   openGroupsBySlot: number[];
   timeSpentOnReportMs: number;
}

export interface VisualizerQueryParams extends AdminProtectionParams {
   query: string;
   nodeLimit: number;
}

export interface ImportDatabasePostParams extends AdminProtectionParams {
   user: string;
   password: string;
   fileName: string;
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
   onlyReturnUsersAmount?: boolean;
   notificationContent?: NotificationContent;
   channelId?: NotificationChannelId;
   filters: AdminNotificationFilter;
}

export interface AdminNotificationFilter {
   usersEmail?: string[];
}

export interface AdminCommandPostParams extends AdminProtectionParams {
   command: string;
}
