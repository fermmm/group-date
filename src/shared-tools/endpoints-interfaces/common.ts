export interface TokenParameter {
   token: string;
}

export interface GenericRequestResponse {
   success: boolean;
}

export interface FacebookResponse {
   id: string;
   email: string;
}

export interface Chat {
   usersDownloadedLastMessage: string[];
   messages: ChatMessage[];
}

export interface ChatMessage {
   chatMessageId: string;
   message: string;
   time: number;
   authorUserId: string;
}
