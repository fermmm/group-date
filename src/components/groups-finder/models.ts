import { GROUP_SLOTS_CONFIGS } from '../../configurations';
import { queryToGetGroupCandidates, queryToGetUsersToAddInActiveGroups } from './queries';
import { fromQueryToGroupCandidates, fromQueryToUsersToAddInActiveGroups } from './tools/data-conversion';

// TODO: Implement
async function searchAndCreateNewGoodQualityGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToGroupCandidates(queryToGetGroupCandidates(i, GroupQuality.Good));
   }
}

// TODO: Implement
async function searchAndAddUsersToExistingGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToUsersToAddInActiveGroups(queryToGetUsersToAddInActiveGroups(i));
   }
}

export interface UsersToAddToActiveGroups {
   userId: string;
   groups: Array<{ groupId: string; membersAndMatches: UserAndItsMatches[] }>;
}

export interface UserAndItsMatches {
   user: string;
   matches: string;
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
