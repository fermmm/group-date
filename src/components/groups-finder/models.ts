import {
   CREATE_BIGGER_GROUPS_FIRST,
   ENABLE_MULTITHREADING_IN_GROUP_FINDER,
   GROUP_SLOTS_CONFIGS,
   MAX_GROUP_SIZE,
   SEARCH_BAD_QUALITY_GROUPS,
   SEARCH_GROUPS_FREQUENCY,
   SINGLE_QUERY_GROUP_FINDER,
} from "../../configurations";
import * as Collections from "typescript-collections";
import { firstBy } from "thenby";
import {
   queryToGetGroupCandidates,
   queryToGetGroupsReceivingMoreUsers,
   queryToGetUsersAllowedToBeOnGroups,
   queryToGetUsersToAddInRecentGroups,
} from "./queries";
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from "./tools/data-conversion";
import {
   analiceGroupCandidate,
   getBestGroup,
   groupHasMinimumQuality,
   dedupGroupCandidates,
} from "./tools/group-candidate-analysis";
import { GroupCandidate, GroupQuality, GroupsReceivingNewUsers, GroupCandidateAnalyzed } from "./tools/types";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { addUsersToGroup, createGroup } from "../groups/models";
import {
   limitGroupToMaximumSizeIfNeeded,
   removeUnavailableUsersFromGroup,
   tryToFixBadQualityGroupIfNeeded,
} from "./tools/group-candidate-editing";
import { addUserToGroupCandidate } from "./tools/group-candidate-editing";
import { Group, UserWithMatches } from "../../shared-tools/endpoints-interfaces/groups";
import { queryToGetUserById } from "../user/queries";
import { executePromises } from "../../common-tools/js-tools/js-tools";
import { queryToGetGroupById } from "../groups/queries";

export async function initializeGroupsFinder(): Promise<void> {
   setIntervalAsync(searchAndCreateNewGroups, SEARCH_GROUPS_FREQUENCY);
}

/**
 * Searches new groups and creates them. This is the core feature of the app.
 * Also searches for users available to be added to recently created groups that are still open for more users.
 */
export async function searchAndCreateNewGroups(): Promise<Group[]> {
   let groupsCreated: Group[] = [];

   /**
    * A user becomes unavailable after entering into a group, we need to store users that entered into a group
    * to not include them in the following iterations.
    * Each slot needs to have it's own list of not available users.
    */
   const notAvailableUsersBySlot: Array<Set<string>> = GROUP_SLOTS_CONFIGS.map(() => new Set());

   // Prepare qualities to search
   const qualitiesToSearch: GroupQuality[] = [];
   qualitiesToSearch.push(GroupQuality.Good);
   if (SEARCH_BAD_QUALITY_GROUPS) {
      qualitiesToSearch.push(GroupQuality.Bad);
   }

   // For each quality and slot search for users that can form a group and create the groups
   for (const quality of qualitiesToSearch) {
      for (const slotIndex of slotsIndexesOrdered()) {
         groupsCreated = [
            ...groupsCreated,
            ...(await createGroupsForSlot(slotIndex, quality, notAvailableUsersBySlot[slotIndex])),
         ];
      }
   }

   // For each quality and slot search for users available to be added to recently created groups that are still open for more users.
   for (const quality of qualitiesToSearch) {
      for (const slotIndex of slotsIndexesOrdered()) {
         await addMoreUsersToRecentGroups(slotIndex, quality, notAvailableUsersBySlot[slotIndex]);
      }
   }

   return groupsCreated;
}

async function createGroupsForSlot(
   slot: number,
   quality: GroupQuality,
   notAvailableUsers: Set<string>,
): Promise<Group[]> {
   const groupsCreated: Group[] = [];
   let groupsFromDatabase: GroupCandidate[] = [];

   /**
    * Call the group finding query
    */
   if (SINGLE_QUERY_GROUP_FINDER) {
      groupsFromDatabase = await fromQueryToGroupCandidates(queryToGetGroupCandidates(slot, quality));
   } else {
      // To not exceed the maximum time for a single query send one request to the database per user
      const usersToSearchIds: string[] = (await queryToGetUsersAllowedToBeOnGroups(slot, quality)
         .values("userId")
         .toList()) as string[];

      const databaseRequests: Array<() => Promise<void>> = [];
      for (const userId of usersToSearchIds) {
         databaseRequests.push(async () => {
            groupsFromDatabase.push(
               ...(await fromQueryToGroupCandidates(
                  queryToGetGroupCandidates(slot, quality, queryToGetUserById(userId)),
               )),
            );
         });
      }

      await executePromises(databaseRequests, ENABLE_MULTITHREADING_IN_GROUP_FINDER);

      // Remove duplicates
      groupsFromDatabase = dedupGroupCandidates(groupsFromDatabase);
   }

   /**
    * Analice, filter and get a BST with group candidates sorted by quality
    */
   const groupCandidatesSorted: GroupsAnalyzedSorted = analiceFilterAndSortGroupCandidates(
      groupsFromDatabase,
      slot,
   );
   let iterations: number = groupCandidatesSorted.size();

   /**
    * Loop all the groups and create them if possible, if not, fix them, reorder after
    * fix and try to create again if possible.
    */
   for (let i = 0; i < iterations; i++) {
      let group: GroupCandidateAnalyzed = groupCandidatesSorted.minimum();
      if (group == null) {
         break;
      }
      groupCandidatesSorted.remove(group);
      const notAvailableUsersOnGroup: UserWithMatches[] = getNotAvailableUsersOnGroup(group, notAvailableUsers);

      /**
       * If everything is fine with the group candidate then create the final group, if not, try to fix it and
       * add the fixed copy to groupCandidates BST list so it gets ordered by quality again and evaluated again.
       */
      if (notAvailableUsersOnGroup.length === 0 && group.group.users.length <= MAX_GROUP_SIZE) {
         const usersIds: string[] = group.group.users.map(u => u.userId);
         setUsersAsNotAvailable(usersIds, notAvailableUsers);
         const groupCreated: Group = await createGroup({ usersIds, slotToUse: slot }, quality);
         groupsCreated.push(groupCreated);
      } else {
         group = removeUnavailableUsersFromGroup(group, notAvailableUsersOnGroup, slot);
         if (group == null) {
            continue;
         }

         group = limitGroupToMaximumSizeIfNeeded(group, slot);
         if (group == null) {
            continue;
         }

         // Check the quality of the group after all the changes
         if (!groupHasMinimumQuality(group)) {
            group = tryToFixBadQualityGroupIfNeeded(group, slot);
            if (group == null) {
               continue;
            }
         }

         /*
            At this point the new group is safe to be added to the list being iterated here in it's 
            corresponding order to be checked again in one of the next iterations of this for-loop
         */
         groupCandidatesSorted.add(group);

         // We increase the iteration of this for-loop since we added an extra item
         iterations++;
      }
   }

   return groupsCreated;
}

/**
 * Adds more users to groups recently created that are still receiving users. Only adds the users if the addition
 * does not have a negative impact on the quality of the group.
 * Returns a list of group ids with the groups that were modified.
 */
async function addMoreUsersToRecentGroups(
   slotIndex: number,
   quality: GroupQuality,
   notAvailableUsers: Set<string>,
): Promise<string[]> {
   const groupsModified: string[] = [];
   let groupsReceivingUsers: GroupsReceivingNewUsers[] = [];

   /**
    * Call the database
    */
   if (SINGLE_QUERY_GROUP_FINDER) {
      groupsReceivingUsers = await fromQueryToGroupsReceivingNewUsers(
         queryToGetUsersToAddInRecentGroups(slotIndex, quality),
      );
   } else {
      // To not exceed the maximum time for a single query send one request to the database per group
      const groupsIds: string[] = (await queryToGetGroupsReceivingMoreUsers(slotIndex, quality)
         .values("groupId")
         .toList()) as string[];

      const databaseRequests: Array<() => Promise<void>> = [];
      for (const groupId of groupsIds) {
         databaseRequests.push(async () => {
            groupsReceivingUsers.push(
               ...(await fromQueryToGroupsReceivingNewUsers(
                  queryToGetUsersToAddInRecentGroups(slotIndex, quality, queryToGetGroupById(groupId)),
               )),
            );
         });
      }

      await executePromises(databaseRequests, ENABLE_MULTITHREADING_IN_GROUP_FINDER);
   }

   for (const groupReceiving of groupsReceivingUsers) {
      const groupsWithNewUser = new Collections.BSTreeKV(getSortFunction());
      const groupsWithNewUserUser: Map<GroupCandidateAnalyzed, string> = new Map();

      for (const userToAdd of groupReceiving.usersToAdd) {
         if (notAvailableUsers.has(userToAdd.userId)) {
            continue;
         }

         const groupWithNewUserAnalyzed: GroupCandidateAnalyzed = analiceGroupCandidate(
            addUserToGroupCandidate(groupReceiving, userToAdd),
         );

         if (!groupHasMinimumQuality(groupWithNewUserAnalyzed)) {
            continue;
         }

         const groupAnalyzed: GroupCandidateAnalyzed = analiceGroupCandidate(groupReceiving);

         // If the group quality decreases when adding the new user then ignore the user
         if (getBestGroup(groupWithNewUserAnalyzed, groupAnalyzed) === groupAnalyzed) {
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
      if (bestUserToAdd != null) {
         await addUsersToGroup(groupReceiving.groupId, { usersIds: [bestUserToAdd], slotToUse: slotIndex });
         groupsModified.push(groupReceiving.groupId);
         notAvailableUsers.add(bestUserToAdd);
      }
   }

   return groupsModified;
}

export function analiceFilterAndSortGroupCandidates(
   groups: GroupCandidate[],
   slot: number,
): GroupsAnalyzedSorted {
   // Group candidates are stored using a Binary Search Tree (BST) for better performance because many times we are going to be adding elements that should be ordered by quality
   const result = new Collections.BSTreeKV(getSortFunction());

   groups.forEach(group => {
      let groupAnalysed: GroupCandidateAnalyzed = analiceGroupCandidate(group);

      groupAnalysed = tryToFixBadQualityGroupIfNeeded(groupAnalysed, slot);
      if (groupAnalysed == null) {
         return;
      }

      result.add(groupAnalysed);
   });

   return result;
}

/**
 * @param alsoSortByAnalysisId When passed to a BST this must be set to true. Default = true
 */
export function getSortFunction(alsoSortByAnalysisId: boolean = true): IThenBy<GroupCandidateAnalyzed> {
   /**
    * The analysis numbers should be rounded to be the same number when are
    * close, this allows sub-ordering by another parameter.
    */
   let result: IThenBy<GroupCandidateAnalyzed>;
   if (CREATE_BIGGER_GROUPS_FIRST) {
      // prettier-ignore
      result = firstBy<GroupCandidateAnalyzed>(g => g.analysis.averageConnectionsAmountRounded, 'desc')
         .thenBy<GroupCandidateAnalyzed>(g => g.analysis.quality, 'asc')
   } else {
      // prettier-ignore
      result = firstBy<GroupCandidateAnalyzed>(g => g.analysis.qualityRounded, 'asc')
         .thenBy<GroupCandidateAnalyzed>(g => g.analysis.averageConnectionsAmount, 'desc')
   }

   /**
    * analysisId is required by the Binary Search Tree to not take same analysis numbers as the same object,
    * BST does not allow duplications and when the sort function returns the same order for 2 elements then
    * the BST considers them as the same element, so an Id to still get a different order is required.
    */
   if (alsoSortByAnalysisId) {
      result = result.thenBy<GroupCandidateAnalyzed>(g => g.analysisId);
   }

   return result;
}

function getNotAvailableUsersOnGroup(
   group: GroupCandidateAnalyzed,
   notAvailableUsers: Set<string>,
): UserWithMatches[] {
   return group.group.users.reduce<UserWithMatches[]>((result, user) => {
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
 * Sorts slots so the bigger group slots first.
 */
export function slotsIndexesOrdered(): number[] {
   const slotsSorted = [...GROUP_SLOTS_CONFIGS];
   const slotsWithIndex = slotsSorted.map((s, i) => ({ slot: s, index: i }));
   slotsWithIndex.sort(firstBy(s => s.slot.minimumSize ?? 0, "desc"));
   return slotsWithIndex.map(s => s.index);
}

export type GroupsAnalyzedSorted = Collections.BSTreeKV<GroupCandidateAnalyzed, GroupCandidateAnalyzed>;
