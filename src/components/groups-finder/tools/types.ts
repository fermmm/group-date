export interface GroupsReceivingNewUsers {
   groupId: string;
   groupMatches: UserWithMatches[];
   usersToAdd: UserWithMatches[];
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
   averageConnectionsAmount: number;
   averageConnectionsAmountRounded: number;
}

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface Slot extends SizeRestriction {
   amount: number;
   releaseTime: number;
}

export enum GroupQuality {
   Good = 'good',
   Bad = 'bad',
}

export const GroupQualityValues = Object.values(GroupQuality);
