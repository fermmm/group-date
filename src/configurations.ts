import { hoursToMilliseconds } from './common-tools/js-tools/js-tools';
import { ONE_MONTH_IN_SECONDS, WEEK_IN_SECONDS } from './common-tools/math-tools/constants';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////  GROUPS SEARCH  /////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The minimum and maximum size of the groups in the app. There has to be a maximum and it's related with how
 * confortable can be to have a date with too much people.
 */
export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 12;

/**
 * The users have a limit in the amount of simultaneous groups they can be members of because being in too
 * many groups at the same time leads to users that will be "too busy" generating groups with absent members.
 *
 * This limitation works with slots, there are a specific number of slots and they can be occupied with groups
 * of specific size for each slot.
 * This slot-size feature it's implemented because different kind of group options are a good reason that
 * justifies having more than one group at the same time (with limits).
 * Also is possible to configure slots for sizes of groups that takes longer to form (the bigger groups),
 * otherwise the slots gets all occupied by fast forming groups first (the smaller ones).
 *
 * This is the configurable list of slots available for the users.
 * If you want to configure the app to have multiple slots with the same group size, use the "amount" property.
 */
export const GROUP_SLOTS = [
   {
      minimumSize: MIN_GROUP_SIZE,
      maximumSize: 6,
      amount: 1,
   },
   {
      minimumSize: 7,
      maximumSize: MAX_GROUP_SIZE,
      amount: 1,
   },
];

/**
 * A slot will be available again after a specific time set in this constant
 */
export const RELEASE_SLOT_TIME = WEEK_IN_SECONDS * 4;

/**
 * The group search algorithm can start searching for small groups first or big ones first, this is important
 * because if small groups are search first that can prevent the big groups from emerging because users are already
 * together in small groups and cannot be together again in a bigger group. Searching big groups first is recommended,
 * because probably big groups are more interesting.
 */
export const SEARCH_BIG_GROUPS_FIRST = true;

/**
 * TODO: Implement
 */
// export const BEST_GROUP_SIZE = 12

/**
 * Metaconnections = The connections of your connections.
 * This value is the maximum allowed numeric distance between the connections of a user an the metaconnections
 * amounts in a range between 0 and 1.
 * In other words: "How much people I connect with and how much other people I have to "share" my connections".
 * Groups with a value higher than this will not be created.
 * For a reference this is a list of groups and their connection-metaconnection values, where "3 for 5" means
 * that 3 users matches with 5 users:
 * 3 for 3: 0
 * 3 for 4: 0.14
 * 3 for 5: 0.25
 * 3 for 6: 0.33
 * 3 for 7: 0.37
 * 3 for 8: 0.40
 *
 * 4 for 5: 0.11
 * 4 for 6: 0.20
 * 4 for 7: 0.26
 * 4 for 8: 0.31
 * 4 for 9: 0.35
 *
 * 2 for 6: 0.50
 */
export const MAX_CONNECTIONS_METACONNECTIONS_DISTANCE = 0.25;

/*
 * If a user has more connections than this number the exceeding connections will not be computed in some calculations.
 * This is important because in real life a person has time for a limited amount of people, so with this parameter is
 * possible to get the calculation results more similar to a real life situation.
 */
export const MAX_CONNECTIONS_POSSIBLE_IN_REALITY = 6;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////  CARDS RECOMMENDATIONS  /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Maximum time (in seconds) since last login allowed, after this inactivity time the user no longera appears
 * on the cards recommendations until next login.
 */
export const CARDS_MAXIMUM_INACTIVITY = ONE_MONTH_IN_SECONDS;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const NOTIFICATION_FREQUENCY_NEW_CARDS = hoursToMilliseconds(24);
export const USE_GROUPS_SEARCH_OPTIMIZED_QUERY = true;
