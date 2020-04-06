import { Chat } from './common';

export interface Group {
   groupId: string;
   chat: Chat;
   dateIdeas: DateIdea[];
   usersThatAccepted: string[];
   feedback: ExperienceFeedback[];
}

export interface DateIdea {
   description: string;
   address: string;
   authorUserId: string;
   votersUserId?: string[];
}

export interface ExperienceFeedback {
   userId: string;
   feedbackType: ExperienceFeedbackType;
   description?: string;
}

export enum ExperienceFeedbackType {
   DidntWantToGo = 'DidntWantToGo',
   CouldNotGo = 'CouldNotGo',
   NoCommunication = 'NoCommunication',
   NoInterestFromGroup = 'NoInterestFromGroup',
   AssistedAndLiked = 'AssistedAndLiked',
   AssistedAndNotLiked = 'AssistedAndNotLiked',
   AssistedAndLovedIt = 'AssistedAndLovedIt',
}
