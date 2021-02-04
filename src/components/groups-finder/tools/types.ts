import { UserWithMatches } from "../../../shared-tools/endpoints-interfaces/groups";

export interface GroupCandidate {
   groupId: string;
   users: UserWithMatches[];
}

export interface GroupCandidateAnalyzed {
   group: GroupCandidate;
   analysis: GroupCandidateAnalysis;
   analysisId: number;
}

export interface GroupsReceivingNewUsers {
   groupId: string;
   users: UserWithMatches[];
   usersToAdd: UserWithMatches[];
}

export interface GroupCandidateAnalysis {
   quality: number;
   qualityRounded: number;
   averageConnectionsAmount: number;
   averageConnectionsAmountRounded: number;
}

export enum GroupQuality {
   Good = "good",
   Bad = "bad",
}

export const GroupQualityValues = Object.values(GroupQuality);
