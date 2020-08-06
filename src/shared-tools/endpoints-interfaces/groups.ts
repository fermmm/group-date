import { ChatMessage } from './common';
import { User } from './user';

export interface Group {
   groupId: string;
   creationDate: number;
   members: User[];
   chat: GroupChat;
   dateIdeas: DateIdea[];
   dayOptions: DayOption[];
   usersThatAccepted: string[];
   feedback: ExperienceFeedback[];
}

export interface GroupChat {
   usersDownloadedLastMessage: string[];
   messages: ChatMessage[];
}

export interface DateIdea {
   description: string;
   address: string;
   authorUserId: string;
   votersUserId: string[];
}

export interface DayOption {
   date: number;
   votersUserId: string[];
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

export interface BasicGroupParams {
   token: string;
   groupId: string;
}

export interface DateIdeaVotePostParams extends BasicGroupParams {
   ideasToVoteAuthorsIds: string[];
}

export interface DayOptionsVotePostParams extends BasicGroupParams {
   daysToVote: number[];
}

export interface ChatPostParams extends BasicGroupParams {
   message: string;
}

export interface FeedbackPostParams extends BasicGroupParams {
   feedback: Omit<ExperienceFeedback, 'userId'>;
}
