import { hoursToMilliseconds } from './common-tools/js-tools/js-tools';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////  GROUP RESTRICTIONS  /////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 12;

/**
 * TODO: Implement
 */
// export const BEST_GROUP_SIZE = 12
// export const MAX_WAITING_FOR_BEST_GROUP = 7; // Days

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
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const NOTIFICATION_FREQUENCY_NEW_CARDS = hoursToMilliseconds(24);
export const USE_GROUPS_SEARCH_OPTIMIZED_QUERY = true;
