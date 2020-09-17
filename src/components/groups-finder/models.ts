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
import { addUsersToGroup, createGroup } from '../groups/models';
import { GroupQualityValues } from './tools/types';
import {
   removeUsersFromGroupCandidate,
   removeUsersRecursivelyByConnectionsAmount,
   tryToFixBadQualityGroup,
} from './tools/group-candidate-editing';
import { objectsContentIsEqual } from '../../common-tools/js-tools/js-tools';
import { addUserToGroupCandidate } from './tools/group-candidate-editing';

export async function initializeGroupsFinder(): Promise<void> {
   groupAnalysisTest(); // Uncomment this line to see in the console different group analysis approaches and test them.
   setIntervalAsync(searchAndCreateNewGroups, SEARCH_GROUPS_FREQUENCY);
}

/**
 * Searches new groups and creates them. This is the core feature of the app.
 * Also searches for users available to be added to recently created groups that are still open for more users.
 */
async function searchAndCreateNewGroups(): Promise<void> {
   // When a user become part of a group becomes unavailable, we need to remember these users to not include them in the following iterations.
   const notAvailableUsers: Set<string> = new Set();

   // For each quality and slot search for users that can form a group and create the groups
   for (const quality of GroupQualityValues) {
      for (const slotIndex of slotsIndexesOrdered()) {
         await createGroupsForSlot(slotIndex, quality, notAvailableUsers);
      }
   }

   // For each quality and slot search for users available to be added to recently created groups that are still open for more users.
   for (const quality of GroupQualityValues) {
      for (const slotIndex of slotsIndexesOrdered()) {
         await addMoreUsersToRecentGroups(slotIndex, quality, notAvailableUsers);
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
   // Group candidates are stored using a Binary Search Tree (BST) for better performance because many times we are going to be adding elements that should be ordered by quality
   const result = new Collections.BSTreeKV(getSortFunction());

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

function getSortFunction(): IThenBy<GroupCandidateAnalyzed> {
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

         // Create a new group candidate removing unavailable users
         let newGroup: GroupCandidate = removeUsersFromGroupCandidate(group.group, notAvailableUsersOnGroup);
         // After users are removed other users should also be removed if their connections amount are too low
         newGroup = removeUsersRecursivelyByConnectionsAmount(newGroup, MINIMUM_CONNECTIONS_TO_BE_ON_GROUP);

         /**
          * After removing non available users if the group is not big enough it's ignored.
          * In the future more users might become available to complete the group or it will
          * be "eaten" by small group creations if the remaining users have free slots for
          * small groups
          */
         if (groupSizeIsUnderMinimum(newGroup.length, slotToUse)) {
            continue;
         }

         // Check the quality of the group after removing unavailable users
         let newGroupAnalyzed = analiceGroupCandidate(newGroup);
         if (!groupHasMinimumQuality(newGroupAnalyzed)) {
            newGroupAnalyzed = tryToFixBadQualityGroup(newGroupAnalyzed, slotToUse);
            if (newGroupAnalyzed == null) {
               continue;
            }
         }

         /*
            At this point the new group is safe to be added to the list being iterated here in it's 
            corresponding order to be checked again in one of the next iterations of this for-loop
         */
         groupCandidates.add(newGroupAnalyzed);

         // We increase the iteration of this for-loop since we added an extra item
         iterations++;
      }
   }
}

async function addMoreUsersToRecentGroups(
   slotIndex: number,
   quality: GroupQuality,
   notAvailableUsers: Set<string>,
): Promise<void> {
   const groupsReceivingUsers: GroupsReceivingNewUsers[] = await fromQueryToGroupsReceivingNewUsers(
      queryToGetGroupsReceivingNewUsers(slotIndex, quality),
   );

   for (const groupReceiving of groupsReceivingUsers) {
      const groupsWithNewUser = new Collections.BSTreeKV(getSortFunction());
      const groupsWithNewUserUser: Map<GroupCandidateAnalyzed, string> = new Map();

      for (const userToAdd of groupReceiving.usersToAdd) {
         if (notAvailableUsers.has(userToAdd.userId)) {
            continue;
         }

         const groupAnalyzed: GroupCandidateAnalyzed = analiceGroupCandidate(groupReceiving.groupMatches);
         const groupWithNewUser = addUserToGroupCandidate(groupReceiving.groupMatches, userToAdd);
         const groupWithNewUserAnalyzed: GroupCandidateAnalyzed = analiceGroupCandidate(groupWithNewUser);

         // If the group quality decreases when adding the new user then ignore the user
         if (compareGroups(groupWithNewUserAnalyzed, groupAnalyzed) === groupAnalyzed) {
            continue;
         }

         // Store the group containing the new user in a BST ordered by group quality
         groupsWithNewUser.add(groupWithNewUserAnalyzed);
         // Relate the group with the user to be retrieved later using this map
         groupsWithNewUserUser.set(groupWithNewUserAnalyzed, userToAdd.userId);
      }

      /**
       * This is adding only one user per group because adding another one requires to evaluate the impact of the
       * addition considering the other new users and that requires more of this iterations.
       */
      const bestGroupWithNewUser: GroupCandidateAnalyzed = groupsWithNewUser.minimum();
      const bestUserToAdd: string = groupsWithNewUserUser.get(bestGroupWithNewUser);
      await addUsersToGroup(groupReceiving.groupId, { usersIds: [bestUserToAdd], slotToUse: slotIndex });
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
 * Compares the analysis of 2 groups and returns the one with best quality. If both groups have exactly the
 * same quality it returns the first one.
 */
export function compareGroups(
   group1: GroupCandidateAnalyzed,
   group2: GroupCandidateAnalyzed,
): GroupCandidateAnalyzed {
   if (objectsContentIsEqual(group1.analysis, group2.analysis)) {
      return group1;
   }
   const result = [group1, group2];
   result.sort(getSortFunction());
   return result[0];
}

/**
 * Sorts slots so the bigger group slots first.
 */
function slotsIndexesOrdered(): number[] {
   const slotsSorted = [...GROUP_SLOTS_CONFIGS];
   const slotsWithIndex = slotsSorted.map((s, i) => ({ slot: s, index: i }));
   slotsWithIndex.sort(firstBy(s => s.slot.minimumSize ?? 0, 'desc'));
   return slotsWithIndex.map(s => s.index);
}

export type GroupsAnalyzedList = Collections.BSTreeKV<GroupCandidateAnalyzed, GroupCandidateAnalyzed>;
