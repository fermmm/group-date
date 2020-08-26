import sort from 'fast-sort';
import { GROUP_SLOTS_CONFIGS, MAX_CONNECTIONS_METACONNECTIONS_DISTANCE } from '../../configurations';
import { queryToGetGroupCandidates, queryToGetGroupsReceivingNewUsers } from './queries';
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from './tools/data-conversion';
import { getConnectionsMetaconnectionsDistance } from './tools/group-candidate-analysis';
import { groupAnalysisTest } from './tools/group-candidate-tests';
import { GroupCandidate, GroupQuality, GroupsReceivingNewUsers, GroupCandidateAnalyzed } from './tools/types';
import { roundDecimals } from '../../common-tools/math-tools/general';

// TODO: Grupos de mala calidad no deberían recibir usuarios una vez creados, por que si no va a meter gente que esta para grupos de buena calidad
// TODO:

/**
 * Uncomment this line to see in the console different group analysis approaches and test them.
 */
groupAnalysisTest();

/**
 * Searches new groups and creates them. This is the core feature of the app.
 */
async function searchAndCreateNewGroups(): Promise<void> {
   const usersAddedToGroupsIds: Map<string, boolean> = new Map();

   /**
    * These loops goes in reverse because slots with bigger groups should be evaluated
    * first to help avoid smaller groups taking over big groups
    */

   // Find good quality groups
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await createGroupsForSlot(i, GroupQuality.Good, usersAddedToGroupsIds);
   }

   // Find bad quality groups
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await createGroupsForSlot(i, GroupQuality.Bad, usersAddedToGroupsIds);
   }

   // Find users to add to groups that are receiving new users
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
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
   await createGroups(groupsAnalyzed, excludeUsers);
}

export function analiceAndFilterGroupCandidates(groups: GroupCandidate[]): GroupCandidateAnalyzed[] {
   return groups.flatMap(group => {
      const quality: number = getConnectionsMetaconnectionsDistance(group);
      const qualityRounded: number = roundDecimals(quality);
      const groupApproved: boolean = MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= quality;

      if (!groupApproved) {
         return [];
      }

      return { group, analysis: { quality, qualityRounded } };
   });
}

export function sortGroupCandidates(groups: GroupCandidateAnalyzed[]): void {
   sort(groups).by([{ asc: u => u.analysis.qualityRounded }, { desc: u => u.group.length }]);
}

async function createGroups(
   groupCandidates: GroupCandidateAnalyzed[],
   excludeUsers: Map<string, boolean>,
): Promise<void> {
   console.log('not implemented');
}
