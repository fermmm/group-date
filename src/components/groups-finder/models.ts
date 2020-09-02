import {
   CREATE_BIGGER_GROUPS_FIRST,
   GROUP_SLOTS_CONFIGS,
   MAX_CONNECTIONS_METACONNECTIONS_DISTANCE,
   MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
   SEARCH_GROUPS_FREQUENCY,
} from '../../configurations';
import * as Collections from 'typescript-collections';
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
// TODO: Cuando se crea un grupo se puede agregar una property al vertex del grupo que sea "quality" en base a eso podemos agregar ususarios a un grupo ya creado si son usuarios que se pueden meter en un bad quality group

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
   const groupsAnalyzed: GroupsAnalyzedList = analiceAndFilterGroupCandidates(groups);
   await createGroups(groupsAnalyzed, excludeUsers, slot, quality);
}

export function analiceAndFilterGroupCandidates(groups: GroupCandidate[]): GroupsAnalyzedList {
   // From this point we use a BST because we are going to be adding elements in order many times
   const result = new Collections.BSTreeKV(getOrderCompareFunction());

   groups.forEach(group => {
      const groupTrimmed: GroupCandidate = removeExceedingConnectionsOnGroupCandidate(
         group,
         MAX_CONNECTIONS_POSSIBLE_IN_REALITY,
      );

      const quality: number = getConnectionsMetaconnectionsDistance(group);
      const groupApproved: boolean = MAX_CONNECTIONS_METACONNECTIONS_DISTANCE >= quality;

      if (!groupApproved) {
         // TODO: Aca generar y agregar un grupo arreglado si se puede
         return;
      }

      const qualityRounded: number = roundDecimals(quality);
      const averageConnectionsAmount: number = getAverageConnectionsAmount(groupTrimmed);
      const averageConnectionsAmountRounded: number = Math.round(getAverageConnectionsAmount(groupTrimmed));

      result.add({
         group,
         analysis: { quality, qualityRounded, averageConnectionsAmount, averageConnectionsAmountRounded },
      });
   });

   return result;
}

export function getOrderCompareFunction(): IThenBy<GroupCandidateAnalyzed> {
   /**
    * The analysis numbers should be rounded to be the same number when are
    * close, this allows sub-ordering by another parameter.
    */
   if (CREATE_BIGGER_GROUPS_FIRST) {
      // prettier-ignore
      return (
         firstBy<GroupCandidateAnalyzed>(g => g.analysis.averageConnectionsAmountRounded, 'desc')
         .thenBy<GroupCandidateAnalyzed>(g => g.analysis.quality, 'asc')
      );
   } else {
      // prettier-ignore
      return (
         firstBy<GroupCandidateAnalyzed>(g => g.analysis.qualityRounded, 'asc')
         .thenBy<GroupCandidateAnalyzed>(g => g.analysis.averageConnectionsAmount, 'desc')
      )
   }
}

async function createGroups(
   groupCandidates: GroupsAnalyzedList,
   excludeUsers: Map<string, boolean>,
   slotToUse: number,
   groupQuality: GroupQuality,
): Promise<void> {
   // TODO: Replace this open for users solution by a quality prop solution
   const openForMoreUsers: boolean = groupQuality === GroupQuality.Good;
   const listLength: number = groupCandidates.size();

   // TODO:
   /**
    * Hay que reemplazar este for por un while(listLength + addedGroups > 0) cada vez que agrego un elemento hago
    * addedGroups++ por que hay que iterar una vez mas por cada grupo generado y siempre en cada iteracion hay que
    * hacer listLength--
    */
   for (let i = 0; i < listLength; i++) {
      const groupCandidate = groupCandidates.minimum();

      // TODO: Si todos los usuarios estan disponibles
      await createGroup({ usersIds: groupCandidate.group.map(u => u.userId), slotToUse }, openForMoreUsers);
      groupCandidates.remove(groupCandidate);
      // TODO: Si hay usuarios no disponibles en el grupo crear un grupo sin esos usuarios, checkear si cumple
      // los requisitos minimos y si los cumple agregarlo a la lista, despues eliminar el actual tambien
      groupCandidates.remove(groupCandidate);
   }
}

/**
 * Sorts slots so the bigger group slots are first, so the big groups gets created first.
 */
export function sortSlotsArray(): void {
   GROUP_SLOTS_CONFIGS.sort(firstBy(s => s.minimumSize ?? 0, 'desc'));
}

export type GroupsAnalyzedList = Collections.BSTreeKV<GroupCandidateAnalyzed, GroupCandidateAnalyzed>;
