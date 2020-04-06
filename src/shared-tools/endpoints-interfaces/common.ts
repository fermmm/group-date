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
   usersTyping: string[];
   usersReadLastMessage: string[];
   messages: ChatMessage[];
}

export interface ChatMessage {
   message: string;
   time: number;
   authorUserId: string;
}
