import { __, column, P, scope, t, g } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   GROUP_SLOTS_CONFIGS,
   MAXIMUM_INACTIVITY_FOR_NEW_GROUPS,
   MAX_GROUP_SIZE,
   MAX_TIME_GROUPS_RECEIVE_NEW_USERS,
   MIN_GROUP_SIZE,
   FORM_BAD_QUALITY_GROUPS_TIME,
   ALLOW_SMALL_GROUPS_BECOME_BIG,
   EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES,
   ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS,
} from "../../configurations";
import * as moment from "moment";
import { queryToGetAllCompleteUsers } from "../user/queries";
import { GroupQuality } from "./tools/types";
import { MINIMUM_CONNECTIONS_TO_BE_ON_GROUP } from "../../configurations";
import { SizeRestriction } from "../../shared-tools/endpoints-interfaces/groups";

/**
 * This query returns lists of users arrays where it's users matches between them.
 * This search is required to create new "group candidates" these groups candidates are later converted
 * into real groups. This is the core feature of the app.
 */
export function queryToGetGroupCandidates(
   targetSlotIndex: number,
   quality: GroupQuality,
   currentTraversal?: Traversal,
): Traversal {
   let traversal: Traversal;

   switch (quality) {
      case GroupQuality.Good:
         traversal = queryToSearchGoodQualityMatchingGroups(targetSlotIndex, currentTraversal);
         break;
      case GroupQuality.Bad:
         traversal = queryToSearchBadQualityMatchingGroups(targetSlotIndex, currentTraversal);
         break;
   }

   traversal = queryToAddDetailsAndIgnoreInvalidSizes(traversal, GROUP_SLOTS_CONFIGS[targetSlotIndex]);

   return traversal;
}

/**
 * Receives a traversal with a list of users and only keeps the ones allowed to be on a new group
 * according to the given group slot.
 * If no traversal is provided then it will start with all complete users and then filter that list.
 */
export function queryToGetUsersAllowedToBeOnGroups(
   targetSlotIndex: number,
   quality: GroupQuality,
   traversal?: Traversal,
): Traversal {
   traversal = traversal ?? queryToGetAllCompleteUsers();
   traversal = traversal
      // Only users with not too many groups already active can be part of new group searches
      .where(
         __.outE("slot" + targetSlotIndex)
            .count()
            .is(P.lt(GROUP_SLOTS_CONFIGS[targetSlotIndex].amount)),
      )

      // Don't introduce inactive users into the groups candidates.
      // Inactive means many time without login and no new users notifications pending
      .not(
         __.has("lastLoginDate", P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_NEW_GROUPS))
            .and()
            .has("sendNewUsersNotification", P.lt(1)),
      );

   if (quality === GroupQuality.Bad) {
      traversal = traversal.where(
         __.values("lastGroupJoinedDate").is(P.lt(moment().unix() - FORM_BAD_QUALITY_GROUPS_TIME)),
      );
   }

   return traversal;
}

/**
 * Generates an anonymous traversal with a user and returns it's matches as long as the matches are users
 * allowed to be on groups
 */
function queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex: number, quality: GroupQuality): Traversal {
   return queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, quality, __.both("Match"));
}

/**
 * This query finds users that matches together forming a group, it's the core query of the app.
 * Returns arrays of matching users.
 *
 * Users are grouped together following this logic:
 *
 * 1. A match and all the other matches in common (triangle shapes in a graph).
 * 2. A user that has at least 2 matches in common (square shapes in a graph).
 *
 * To test the query easily:
 * https://gremlify.com/28ks1qe9obji
 *
 * Old version with horrible performance:
 * https://gremlify.com/5lgbctob8n4
 */
function queryToSearchGoodQualityMatchingGroups(
   targetSlotIndex: number,
   currentTraversal?: Traversal,
): Traversal {
   const traversal: Traversal =
      currentTraversal ?? queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good);

   return (
      traversal
         .as("u")
         // Find groups
         .flatMap(
            queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good)
               // This avoids repetitions by avoiding same resulting inverse comparisons
               .flatMap(
                  __.union(
                     // Find groups of connected triangles and couples (couples are useful to form squares)
                     queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good).where(
                        __.both("Match").as("u"),
                     ),

                     // With the search below the starting user and the match are not added so we add it here
                     __.identity(),
                     __.select("u"),
                  )
                     // Order the group members so later dedup() does not take different order in members as a different group
                     .order()
                     .by(t.id)
                     .fold(),
               ),
         )
         .dedup()

         // Make a copy of the group (or merge) but this time include "square" shapes formed with 2 matching
         // users from the group and 2 matching users from outside of the group, this allows square
         // shapes, which is a characteristic of groups with heterosexual members and also in other attraction cases.
         .flatMap(
            __.union(
               EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES ? __.identity() : __.union(),
               __.union(
                  __.identity().unfold(),
                  __.identity()
                     .as("group")
                     .unfold()
                     .as("groupMember")

                     // Get match outside the group (union is used only to be able to call a function)
                     .union(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good))
                     .not(__.where(P.within("group")))

                     // But only matches that forms a square with 2 members of the group
                     .where(
                        queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Good)
                           .not(__.where(P.within("group")))
                           .where(__.both("Match").where(P.within("group")).where(P.neq("groupMember"))),
                     ),
               )
                  .dedup()
                  // Order the group members so later dedup() does not take different order in members as a different group
                  .order()
                  .by(t.id)
                  .fold(),
            ),
         )
         .dedup()
   );
}

/**
 * This query searches for matching users that are not so well connected so they can form a bad quality group.
 *
 * These groups are "circles" of users with 2 connections each, can be visualized as a round of
 * people.
 *
 * To test the query easily:
 * https://gremlify.com/o9rye6xy5od
 */
function queryToSearchBadQualityMatchingGroups(
   targetSlotIndex: number,
   currentTraversal?: Traversal,
): Traversal {
   const searches: Traversal[] = [];

   for (let i = 5; i <= MAX_GROUP_SIZE; i++) {
      searches.push(
         __.repeat(queryToGetMatchesAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Bad).simplePath())
            .times(i - 1)
            .where(__.both("Match").as("a"))
            .path()
            .from_("a"),
      );
   }

   const traversal: Traversal =
      currentTraversal ?? queryToGetUsersAllowedToBeOnGroups(targetSlotIndex, GroupQuality.Bad);

   return (
      traversal
         .as("a")

         // Find shapes
         .union(...searches)

         // Remove duplicates. Also ordering the users is needed here so dedup recognizes all the groups as the same one
         .map(__.unfold().order().by(t.id).dedup().fold())
         .dedup()
   );
}

/**
 * Receives a traversal with a list of users arrays and for each user adds it's matches within the group. This extra
 * info is required by the group quality analyzer.
 * Groups sizes below minimum group size are discarded here.
 * Groups sizes over maximum slot size are ignored if there is a bigger slot available.
 * The query makes no action when the group is bigger than MAX_GROUP_SIZE, cutting the group must be done correctly
 * by the JS logic because the inconsistency left after removing a user (like a user with a single match left) must
 * be handled outside of Gremlin.
 *
 * To test the query easily:
 * https://gremlify.com/h1t3sapjlkc
 *
 *
 * @param slotSize Size restriction. This is not to limit the group size, it's for ignoring groups with sizes outside the limits passed.
 * @param returnNames Default = false. If set to true returns user names instead of userId. Useful for debugging.
 */
function queryToAddDetailsAndIgnoreInvalidSizes(traversal: Traversal, slotSize?: SizeRestriction): Traversal {
   return traversal.map(
      __.where(
         __.count(scope.local)
            .is(P.gte(MIN_GROUP_SIZE))
            .is(P.gte(slotSize?.minimumSize ?? 0))
            .is(
               P.lte(
                  ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS === false && slotSize?.maximumSize != null
                     ? slotSize.maximumSize
                     : 99999,
               ),
            ),
      )
         .as("g")
         .unfold()
         .map(
            __.project("userId", "matches")
               .by(__.values("userId"))
               .by(
                  __.as("u")
                     .both("Match")
                     .where(P.within("g")) // Get the matches of the user within the group
                     .values("userId")
                     .fold(),
               ),
         )
         // This could be useful in the future to improve performance on JS side:
         // .order()
         // .by(__.select('matches').count(scope.local), order.desc) // Order the users by their amount of matches
         .fold()
         .choose(__.count(scope.local).is(P.eq(0)), __.unfold()), // Remove empty arrays caused by the group size restrictions
   );
}

export function queryToGetGroupsReceivingMoreUsers(slotIndex: number, quality: GroupQuality): Traversal {
   return (
      g
         .V()
         .hasLabel("group")
         // Active groups
         .where(__.has("creationDate", P.gt(moment().unix() - MAX_TIME_GROUPS_RECEIVE_NEW_USERS)))
         // Groups of the target quality. This prevents occupying slots of good quality capable users with low quality groups
         .where(__.has("initialQuality", quality))
         // Groups that has space for more users and match the slot config passed
         .where(
            __.in_("member")
               .count()
               .is(P.lt(MAX_GROUP_SIZE)) // Not groups already full
               .is(P.gte(GROUP_SLOTS_CONFIGS[slotIndex].minimumSize ?? MIN_GROUP_SIZE)) // Groups bigger than the minimum size in slot
               .is(
                  P.lte(
                     ALLOW_SMALL_GROUPS_BECOME_BIG
                        ? MAX_GROUP_SIZE
                        : GROUP_SLOTS_CONFIGS[slotIndex].maximumSize ?? MAX_GROUP_SIZE,
                  ),
               ),
         )
   );
}

/**
 * Returns a list of groups that are recently created so they still can receive new users along with a list of users
 * that can be added to each group. Also details of each group are included.
 * Active groups are open to adding new users as long as the new user has 2 matches within the members of the group.
 *
 * To play with this query:
 * https://gremlify.com/3hrqz4ijyvt
 */
export function queryToGetUsersToAddInRecentGroups(
   slotIndex: number,
   quality: GroupQuality,
   currentTraversal?: Traversal,
): Traversal {
   const traversal = currentTraversal ?? queryToGetGroupsReceivingMoreUsers(slotIndex, quality);

   return (
      // Get users to add to these groups
      traversal
         .project("group", "usersToAdd")
         .by()
         .by(
            // Find matches of the member group that are not members of the group
            __.as("group")
               .in_("member")
               .both("Match")
               .not(__.where(__.out("member").as("group")))
               // Only include users allowed to be in new groups
               .union(queryToGetUsersAllowedToBeOnGroups(slotIndex, quality, __))
               // Find the matches that the user has inside the group
               .group()
               .by(__.values("userId"))
               .by(__.both("Match").where(__.out("member").as("group")).dedup().values("userId").fold())
               .unfold()
               .project("userId", "matches")
               .by(column.keys)
               .by(column.values)
               // Discard users with not enough connections amount
               .where(__.select("matches").count(scope.local).is(P.gte(MINIMUM_CONNECTIONS_TO_BE_ON_GROUP)))
               .fold(),
         )
         // Discard groups with no users to add
         .where(__.select("usersToAdd").unfold())

         // Re create the object we have at this point adding "groupMatches" with the members of the
         // group and their matches
         .project("groupId", "usersToAdd", "users")
         .by(__.select("group").values("groupId"))
         .by(__.select("usersToAdd"))
         .by(
            // Get members of the group and their matches (it does not include the possible new member)
            __.select("group")
               .as("group")
               .in_("member")
               .project("userId", "matches")
               .by(__.values("userId"))
               .by(__.both("SeenMatch").where(__.out("member").as("group")).values("userId").fold())
               .fold(),
         )
   );
}
