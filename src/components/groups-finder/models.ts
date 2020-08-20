import { GROUP_SLOTS_CONFIGS } from '../../configurations';
import { queryToGetGroupCandidates, queryToGetGroupsReceivingNewUsers } from './queries';
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from './tools/data-conversion';
import { groupOrderingTest } from './tools/group-candidate-test';

// groupOrderingTest()

// TODO: Implement
async function searchAndCreateNewGoodQualityGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToGroupCandidates(queryToGetGroupCandidates(i, GroupQuality.Good));
   }
}

// TODO: Implement
async function searchAndAddUsersToExistingGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToGroupsReceivingNewUsers(queryToGetGroupsReceivingNewUsers(i));
   }
}

export interface GroupsReceivingNewUsers {
   groupId: string;
   usersToAdd: Array<{ userId: string; matchesAmount: number }>;
   groupMatches: UserAndItsMatches[];
}

export interface UserAndItsMatches {
   user: string;
   matches: string[];
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
