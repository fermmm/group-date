import {
   CREATE_BIGGER_GROUPS_FIRST,
   GROUP_SLOTS_CONFIGS,
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
   SEARCH_GROUPS_FREQUENCY,
} from '../../configurations';
import { firstBy } from 'thenby';
import { queryToGetGroupCandidates, queryToGetGroupsReceivingNewUsers } from './queries';
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from './tools/data-conversion';
import {
   getAverageConnectionsAmount,
   getConnectionsMetaconnectionsDistance,
   removeExceedingConnectionsOnGroupCandidate,
} from './tools/group-candidate-analysis';
import { groupAnalysisTest } from './tools/group-candidate-tests';
import { GroupCandidate, GroupQuality, GroupsReceivingNewUsers, GroupCandidateAnalyzed } from './tools/types';
import { roundDecimals } from '../../common-tools/math-tools/general';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { createGroup } from '../groups/models';

// TODO: Reemplazar grupos rechazados por una version mejorada con menos usuarios

export async function initializeGroupsFinder(): Promise<void> {
   /**
    * Uncomment this line to see in the console different group analysis approaches and test them.
    */
   groupAnalysisTest();
   sortSlotsArray();
   setIntervalAsync(searchAndCreateNewGroups, SEARCH_GROUPS_FREQUENCY);
}

/**
 * Searches new groups and creates them. This is the core feature of the app.
 */
async function searchAndCreateNewGroups(): Promise<void> {
   const usersAddedToGroupsIds: Map<string, boolean> = new Map();

   // Find good quality groups
   for (let i = 0; i < GROUP_SLOTS_CONFIGS.length; i++) {
      await createGroupsForSlot(i, GroupQuality.Good, usersAddedToGroupsIds);
   }

   // Find bad quality groups
   for (let i = 0; i < GROUP_SLOTS_CONFIGS.length; i++) {
      await createGroupsForSlot(i, GroupQuality.Bad, usersAddedToGroupsIds);
   }

   // Find users to add to groups that are receiving new users
   for (let i = 0; i < GROUP_SLOTS_CONFIGS.length; i++) {
      const groupsReceivingUsers: GroupsReceivingNewUsers[] = await fromQueryToGroupsReceivingNewUsers(
         queryToGetGroupsReceivingNewUsers(i),
      );
   }
}

async function createGroupsForSlot(
   slot: number,
   quality: GroupQuality,
   excludeUsers: Map<string, boolean>,
): Promise<void> {
   const groups: GroupCandidate[] = await fromQueryToGroupCandidates(queryToGetGroupCandidates(slot, quality));
   const groupsAnalyzed: GroupCandidateAnalyzed[] = analiceAndFilterGroupCandidates(groups);
   sortGroupCandidates(groupsAnalyzed);
   await createGroups(groupsAnalyzed, excludeUsers, slot, quality);
}

export function analiceAndFilterGroupCandidates(groups: GroupCandidate[]): GroupCandidateAnalyzed[] {
   return groups.reduce<GroupCandidateAnalyzed[]>((result, group) => {
      const groupTrimmed: GroupCandidate = removeExceedingConnectionsOnGroupCandidate(
         group,
         MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
      );

      const quality: number = getConnectionsMetaconnectionsDistance(group);
      const groupApproved: boolean = MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= quality;

      // TODO: Aca devolver un grupo arreglado si se puede
      if (!groupApproved) {
         return result;
      }

      const qualityRounded: number = roundDecimals(quality);
      const averageConnectionsAmount: number = getAverageConnectionsAmount(groupTrimmed);
      const averageConnectionsAmountRounded: number = Math.round(getAverageConnectionsAmount(groupTrimmed));

      result.push({
         group,
         analysis: { quality, qualityRounded, averageConnectionsAmount, averageConnectionsAmountRounded },
      });
      return result;
   }, []);
}

export function sortGroupCandidates(groups: GroupCandidateAnalyzed[]): void {
   /**
    * The analysis numbers should be rounded to be the same number when are
    * close, this allows sub-ordering by another parameter.
    */

   if (CREATE_BIGGER_GROUPS_FIRST) {
      groups.sort(
         firstBy<GroupCandidateAnalyzed>(g => g.analysis.averageConnectionsAmountRounded, 'desc').thenBy(
            g => g.analysis.quality,
            'asc',
         ),
      );
   } else {
      groups.sort(
         firstBy<GroupCandidateAnalyzed>(g => g.analysis.qualityRounded, 'asc').thenBy(
            g => g.analysis.averageConnectionsAmount,
            'desc',
         ),
      );
   }
}

async function createGroups(
   groupCandidates: GroupCandidateAnalyzed[],
   excludeUsers: Map<string, boolean>,
   slotToUse: number,
   groupQuality: GroupQuality,
): Promise<void> {
   // TODO: Completar implementacion

   // Bad quality groups cannot receive more users after created, otherwise users capable to be on good groups can be inserted in bad groups
   const openForMoreUsers = groupQuality === GroupQuality.Good;

   for (const groupCandidate of groupCandidates) {
      await createGroup({ usersIds: groupCandidate.group.map(u => u.userId), slotToUse }, openForMoreUsers);
   }
}

/**
 * Sorts slots so the bigger group slots are first, so the big groups gets created first.
 */
export function sortSlotsArray(): void {
   GROUP_SLOTS_CONFIGS.sort(firstBy(s => s.minimumSize ?? 0, 'desc'));
}
