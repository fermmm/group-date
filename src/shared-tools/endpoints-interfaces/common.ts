export interface TokenParameter {
   token: string;
}

export interface GenericRequestResponse {
   success: boolean;
}

export interface ChatMessage {
   chatMessageId: string;
   messageText: string;
   time: number;
   authorUserId: string;
}
