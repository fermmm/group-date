export interface GroupsReceivingNewUsers {
   groupId: string;
   usersToAdd: Array<{ userId: string; matchesAmount: number }>;
   groupMatches: UserWithMatches[];
}

export interface UserWithMatches {
   userId: string;
   matches: string[];
}

export type GroupCandidate = UserWithMatches[];

export interface GroupCandidateAnalyzed {
   group: GroupCandidate;
   analysis: GroupCandidateAnalysis;
}

export interface GroupCandidateAnalysis {
   quality: number;
   qualityRounded: number;
}

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface GroupSlotConfig extends SizeRestriction {
   amount: number;
}

export enum GroupQuality {
   Bad,
   Good,
}
