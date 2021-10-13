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

export interface AdminLogGetParams extends TokenParameter {
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

export interface AdminNotificationPostParams extends TokenParameter {
   targetUserId: string;
   notification: NotificationContent;
   channelId: NotificationChannelId;
}

export interface VisualizerQueryParams extends AdminProtectionParams {
   query: string;
   nodeLimit: number;
}

export interface LoadCsvPostParams extends AdminProtectionParams {
   user: string;
   password: string;
   folder?: string;
   fileId?: string;
}

export interface CredentialsValidationResult {
   isValid: boolean;
   error?: string;
}
