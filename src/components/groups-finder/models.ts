import {
   CREATE_BIGGER_GROUPS_FIRST,
   GROUP_SLOTS_CONFIGS,
   MINIMUM_CONNECTIONS_TO_BE_ON_GROUP,
   SEARCH_GROUPS_FREQUENCY,
} from '../../configurations';
import * as Collections from 'typescript-collections';
import { firstBy } from 'thenby';
import { queryToGetGroupCandidates, queryToGetGroupsReceivingNewUsers } from './queries';
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from './tools/data-conversion';
import {
   analiceGroupCandidate,
   groupHasMinimumQuality,
   groupSizeIsUnderMinimum,
} from './tools/group-candidate-analysis';
import { groupAnalysisTest } from './tools/group-candidate-tests';
import {
   GroupCandidate,
   GroupQuality,
   GroupsReceivingNewUsers,
   GroupCandidateAnalyzed,
   UserWithMatches,
} from './tools/types';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { createGroup } from '../groups/models';
import { GroupQualityValues } from './tools/types';
import {
   removeUsersFromGroupCandidate,
   removeUsersRecursivelyByConnectionsAmount,
   tryToFixBadQualityGroup,
} from './tools/group-candidate-editing';

// TODO: Se podria poner la configuracion de duracion del slot por cada slot en lugar de uno general
// de esa manera se podria generar grupos grandes un poco mas seguido ya que tardan mas en formarse y
// hay menos, cosa de que se libere mas gente para grupos grandes mas rapido, favoreciendolos y no
// dejandolos para que se los coman los grupos chicos

// TODO: Supongamos que un usuario recien registrado puede en un dia generar un grupo grande por que matcha rapido
// entonces dependiendo de la hora a la que se ejecuta el algoritmo va a estar en un grupo grande o en un grupo chico
// eso es muy arbitrario, habria que esperar un tiempo hasta que el usuario empieza a poder formar grupo
// Aunque tambien seria arbitrario por que depende la hora puede pertenecer a un grupo o no por que por ahi ya cierra

// TODO: Cuando escriba los test hay que tener en cuenta que pasa mientras los usuarios van matcheando
// si se permite esperar a que los usuarios vayan matcheando gradualmente y formen un grupo grande o no
// TODO: Cuando escriba los test tengo que testar que un usuario sin slots disponibles no pueda entrar a un grupo

export async function initializeGroupsFinder(): Promise<void> {
   groupAnalysisTest(); // Uncomment this line to see in the console different group analysis approaches and test them.
   setIntervalAsync(searchAndCreateNewGroups, SEARCH_GROUPS_FREQUENCY);
}

/**
 * Searches new groups and creates them. This is the core feature of the app.
 */
async function searchAndCreateNewGroups(): Promise<void> {
   /*
    * We need to store users added to any of this new groups to not add them again in another one since there
    * is a limit on the amount of groups a user can be part of
    */
   const notAvailableUsers: Set<string> = new Set();

   // For each quality and slot create a group search
   for (const quality of GroupQualityValues) {
      for (const slotIndex of slotsIndexesOrdered()) {
         await createGroupsForSlot(slotIndex, quality, notAvailableUsers);
      }
   }

   for (const quality of GroupQualityValues) {
      for (const slotIndex of slotsIndexesOrdered()) {
         // TODO: Terminar esto, no se deberia aregar usuarios a un grupo si estos disminuyen su calidad
         // los grupos fueron creados por ser mejores que otros, no tendria sentido arruinarlos
         // se podria evaluar el impacto de cada usuario o de cada par de usuarios o algo asi por que uno
         // solo puede disminuir la calidad pero combinado con otro aumentarla
         const groupsReceivingUsers: GroupsReceivingNewUsers[] = await fromQueryToGroupsReceivingNewUsers(
            queryToGetGroupsReceivingNewUsers(slotIndex, quality),
         );
      }
   }
}

async function createGroupsForSlot(
   slot: number,
   quality: GroupQuality,
   notAvailableUsers: Set<string>,
): Promise<void> {
   const groups: GroupCandidate[] = await fromQueryToGroupCandidates(queryToGetGroupCandidates(slot, quality));
   const groupsAnalyzed: GroupsAnalyzedList = analiceAndFilterGroupCandidates(groups, slot);
   await createGroups(groupsAnalyzed, notAvailableUsers, slot, quality);
}

export function analiceAndFilterGroupCandidates(groups: GroupCandidate[], slot: number): GroupsAnalyzedList {
   // From this point we use a BST for better performance because many times we are going to be adding elements that should be ordered
   const result = new Collections.BSTreeKV(getOrderFunction());

   groups.forEach(group => {
      let groupAnalysed: GroupCandidateAnalyzed = analiceGroupCandidate(group);
      if (!groupHasMinimumQuality(groupAnalysed)) {
         groupAnalysed = tryToFixBadQualityGroup(groupAnalysed, slot);
         if (groupAnalysed == null) {
            return;
         }
      }
      result.add(groupAnalysed);
   });

   return result;
}

function getOrderFunction(): IThenBy<GroupCandidateAnalyzed> {
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
   notAvailableUsers: Set<string>,
   slotToUse: number,
   groupQuality: GroupQuality,
): Promise<void> {
   let iterations: number = groupCandidates.size();

   for (let i = 0; i < iterations; i++) {
      const group: GroupCandidateAnalyzed = groupCandidates.minimum();
      groupCandidates.remove(group);
      const notAvailableUsersOnGroup: UserWithMatches[] = getNotAvailableUsersOnGroup(group, notAvailableUsers);

      if (notAvailableUsersOnGroup.length === 0) {
         const usersIds: string[] = group.group.map(u => u.userId);
         setUsersAsNotAvailable(usersIds, notAvailableUsers);
         await createGroup({ usersIds, slotToUse }, groupQuality);
      } else {
         // If the "not available" users amount is too much it can be discarded without trying to fix it
         if (groupSizeIsUnderMinimum(group.group.length - notAvailableUsersOnGroup.length, slotToUse)) {
            continue;
         }

         let newGroup: GroupCandidate = removeUsersFromGroupCandidate(group.group, notAvailableUsersOnGroup);
         newGroup = removeUsersRecursivelyByConnectionsAmount(newGroup, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);

         /**
          * After removing non available users if the group is not big enough it's ignored to be on hold until
          * more users become available to complete the group or it's "eaten" by small group creation algorithm
          * if the remaining users have free small groups slots
          */
         if (groupSizeIsUnderMinimum(newGroup.length, slotToUse)) {
            continue;
         }

         let newGroupAnalyzed = analiceGroupCandidate(newGroup);
         if (!groupHasMinimumQuality(newGroupAnalyzed)) {
            newGroupAnalyzed = tryToFixBadQualityGroup(newGroupAnalyzed, slotToUse);
            if (newGroupAnalyzed == null) {
               continue;
            }
         }

         groupCandidates.add(newGroupAnalyzed);
         // We increase the iteration of this loop since we added an extra item
         iterations++;
      }
   }
}

function getNotAvailableUsersOnGroup(
   group: GroupCandidateAnalyzed,
   notAvailableUsers: Set<string>,
): UserWithMatches[] {
   return group.group.reduce<UserWithMatches[]>((result, user) => {
      if (notAvailableUsers.has(user.userId)) {
         result.push(user);
      }
      return result;
   }, []);
}

function setUsersAsNotAvailable(usersIds: string[], notAvailableUsers: Set<string>): void {
   usersIds.forEach(u => notAvailableUsers.add(u));
}

/**
 * Sorts slots so the bigger group slots are first, so the big groups gets created first.
 */
function slotsIndexesOrdered(): number[] {
   const slotsSorted = [...GROUP_SLOTS_CONFIGS];
   const slotsWithIndex = slotsSorted.map((s, i) => ({ slot: s, index: i }));
   slotsWithIndex.sort(firstBy(s => s.slot.minimumSize ?? 0, 'desc'));
   return slotsWithIndex.map(s => s.index);
}

export type GroupsAnalyzedList = Collections.BSTreeKV<GroupCandidateAnalyzed, GroupCandidateAnalyzed>;
