import { ChatMessage } from "./common";
import { User } from "./user";

export interface Group {
   groupId: string;
   name: string;
   creationDate: number;
   membersAmount: number;
   members: User[];
   chat: GroupChat;
   chatMessagesAmount: number;
   dateIdeasVotes: IdeaOption[];
   dayOptions: DayOption[];
   openForMoreUsers: boolean;
   feedback: ExperienceFeedback[];
   matches: UserWithMatches[];
   mostVotedDate?: number;
   mostVotedIdea?: string;
   reminder1NotificationSent: boolean;
   reminder2NotificationSent: boolean;
   seenBy: string[];
}

export interface GroupChat {
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

export interface IdeaOption {
   ideaOfUser: string;
   votersUserId: string[];
}

export interface ExperienceFeedback {
   userId: string;
   feedbackType: ExperienceFeedbackType;
   description?: string;
}

export enum ExperienceFeedbackType {
   DidntWantToGo = "DidntWantToGo",
   CouldNotGo = "CouldNotGo",
   NoCommunication = "NoCommunication",
   NoInterestFromGroup = "NoInterestFromGroup",
   AssistedAndLiked = "AssistedAndLiked",
   AssistedAndNotLiked = "AssistedAndNotLiked",
   AssistedAndLovedIt = "AssistedAndLovedIt",
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
   feedback: Omit<ExperienceFeedback, "userId">;
}

export interface UserWithMatches {
   userId: string;
   matches: string[];
}

export interface GroupMembership {
   newMessagesRead: boolean;
   readMessagesAmount: number;
}

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface Slot extends SizeRestriction {
   amount: number;
   releaseTime: number;
}

export interface UnreadMessagesAmount {
   unread: number;
}

export interface SeenByPostParams extends BasicGroupParams {
   userId: string;
}
