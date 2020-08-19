import { hoursToMilliseconds } from './common-tools/js-tools/js-tools';
import { DAY_IN_SECONDS, ONE_MONTH_IN_SECONDS, WEEK_IN_SECONDS } from './common-tools/math-tools/constants';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////  GROUPS  ////////////////////////////////////////////////////
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
 * This limitation works with a "group slot" system: Each user has a limited number of group slots, also each
 * slot is reserved for a specific group size.
 * This slot-size feature it's implemented because different kind of group size options are a good reason that
 * justifies having more than one group at the same time (with limits).
 * Also this feature solves another problem: The bigger groups takes more time to form without size reserved
 * slots the slots would get all occupied by fast forming groups first (the smaller ones) giving an unintended
 * priority to these groups.
 * The slots gets released after some configurable time.
 *
 * So this is the configurable list of slots available for the users.
 * If you want to configure the app to have multiple slots with the same group size, use the "amount" property.
 * If the minimum size of a group slot is the minimum size of a possible group in the app don't include
 * the minimumSize property the same applies for the maximumSize property.
 * It's recommended to order the smaller group slots first. It will start searching the bigger groups first from
 * the bottom.
 */
// TODO: Implementar un tiempo sin grupos para cada slot, de manera que no busque grupos chicos hasta que no encuentre grandes
export const GROUP_SLOTS_CONFIGS = [
   {
      maximumSize: 6,
      amount: 1,
   },
   {
      minimumSize: 7,
      amount: 1,
   },
];

/**
 * A slot will be available again after a specific time set in this constant
 */
export const RELEASE_SLOT_TIME = WEEK_IN_SECONDS * 3;

/**
 * Bad quality groups are groups where each user only has 2 matches, these groups are probably less interesting
 * so only appears to users that don't have a group in a long time, that time is this setting.
 */
export const SHOW_BAD_QUALITY_GROUPS_TIME = WEEK_IN_SECONDS * 6;

/**
 * TODO: Checkear si esta buena esta setting
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
 * If a user has more connections than this number the exceeding connections will not be computed in the group quality
 * algorithm.
 * This is important because in real life a person has time for a limited amount of people, so with this parameter is
 * possible to get the calculation results more similar to a real life situation.
 */
export const MAX_CONNECTIONS_POSSIBLE_IN_REALITY = 6;

/**
 * Maximum amount of options to vote the day of the date.
 */
export const MAX_WEEKEND_DAYS_VOTE_OPTIONS = 12;

/**
 * Maximum time (in seconds) since last login allowed, after this inactivity time the user is no longer part of
 * new groups searching until next login.
 */
export const MAXIMUM_INACTIVITY_FOR_NEW_GROUPS = ONE_MONTH_IN_SECONDS;

/**
 * After a group is created it can still receive new users until a time passed.
 * Too high times in this setting is dangerous because there is a situation where members are added after a
 * group already met in person, this has serious negative impact since all the matches in the group becomes
 * "seen matches" so "late" users will not see the matching members of the group again.
 * A possible improvement to implement is a way to know if the users met in person and use that instead of
 * a timer to close the group.
 */
export const MAX_TIME_GROUPS_RECEIVE_NEW_USERS = DAY_IN_SECONDS * 2;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////  CARDS RECOMMENDATIONS  /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Maximum time (in seconds) since last login allowed, after this inactivity time the user no longer appears
 * on the cards recommendations until next login.
 */
export const MAXIMUM_INACTIVITY_FOR_CARDS = ONE_MONTH_IN_SECONDS;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const NOTIFICATION_FREQUENCY_NEW_CARDS = hoursToMilliseconds(24);
export const FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY = hoursToMilliseconds(25);
export const MAX_CHAT_MESSAGES_STORED_ON_SERVER = 15;
export const CARDS_GAME_MAX_RESULTS_PER_REQUEST: number = 70;
