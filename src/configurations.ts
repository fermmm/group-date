import { hoursToMilliseconds } from './common-tools/math-tools/general';
import { DAY_IN_SECONDS, ONE_MONTH_IN_SECONDS, WEEK_IN_SECONDS } from './common-tools/math-tools/constants';
import { Slot } from './components/groups-finder/tools/types';
import { QuestionData } from './shared-tools/endpoints-interfaces/user';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////  GROUPS  ////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The minimum and maximum size of the groups in the app.
 * The maximum is related with how confortable can be to have a date with too much people.
 * The minimum is related to an issue where statistically only half of the people that confirmed goes to the
 * date, this happens in general when organizing events online. So if the minimum group size is too low
 * the groups could be too broken when they meet each other.
 *
 * For the moment we will set the minimum at 3 and see what happens.
 */
export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 18;

/**
 * The required amount of matches to have with members of a group in order to become part of it
 */
export const MINIMUM_CONNECTIONS_TO_BE_ON_GROUP = 2;

/**
 * The users need to have a limit in the amount of simultaneous groups they can be members of because being in too
 * many groups at the same time potentially leads to users that will be "too busy" generating absent members.
 *
 * This problem is solved with a limitation of groups using a slot system: Each user has a limited number of
 * "group slots", each slot is reserved for a specific group size. Currently there are 2 slots, one for small
 * groups and one for big groups.
 *
 * This "slot for a size" feature it's implemented because being in different kind of groups is a good reason
 * to make the limitation more flexible to 2 groups at the same time, or more, but still limited.
 * Also solves another problem: The bigger groups takes more time to form so they should have a reserved slot
 * available for the moment the group is formed.
 * Slots gets available again after a configurable time, in theory this should be the average time the users
 * take to finally meet.
 *
 * Parameters:
 *
 *    @param minimumSize Don't set this value if the slot is the one handling the smaller groups.
 *    @param maximumSize Don't set this value if the slot is the one handling the bigger groups.
 *    @param amount If you want to configure the app to have multiple slots with the same group size, use this
 *                  property, don't duplicate slots
 *    @param releaseTime A group slot will be available again after a specific time set in this constant
 */
export const GROUP_SLOTS_CONFIGS: Slot[] = [
   {
      maximumSize: 6,
      amount: 1,
      releaseTime: WEEK_IN_SECONDS * 3,
   },
   {
      minimumSize: 7,
      amount: 1,
      releaseTime: WEEK_IN_SECONDS * 2,
   },
];

/**
 * NOT TESTED FEATURE, NOT READY FOR PRODUCTION: It probably doesn't work or has bad performance.
 *
 * When users are not in groups for a long time they can be allowed to be on "bad quality groups".
 * Bad quality group is a group where all members only have 2 matches forming rectangle or circle
 * shapes in a graph.
 */
export const SEARCH_BAD_QUALITY_GROUPS = false;

/**
 * NOT TESTED FEATURE, NOT READY FOR PRODUCTION: It probably doesn't work or has bad performance.
 *
 * Bad quality groups are groups where each user only has 2 matches, these groups are probably less interesting
 * so only appears to users that don't have a group in a long time, that time is this setting.
 *
 * This option is only enabled if SEARCH_BAD_QUALITY_GROUPS = true
 */
export const FORM_BAD_QUALITY_GROUPS_TIME = WEEK_IN_SECONDS * 6;

/**
 * After a group is created and the members are interacting it can still receive new users until a time passed.
 * Too high times in this setting is dangerous because there is a possible situation where members are added
 * after too much time where the group already met in person, this is serious since late arriving users will not
 * see the matching members of the group in person and will not form group with them again because the members
 * are now "seen matches". So it's a good idea to keep this setting low.
 */
export const MAX_TIME_GROUPS_RECEIVE_NEW_USERS = DAY_IN_SECONDS * 2;

/**
 * If true will create bigger groups first, the result is more bigger groups.
 * If false it will create quality groups first, the result will be less bigger groups but better quality.
 * Quality means more matches between members and better distribution of them.
 */
export const CREATE_BIGGER_GROUPS_FIRST: boolean = true;

/**
 * When searching for small groups and finds a big group:
 * true = Use the small group slot to store the big group
 * false = Discard the big group until all users has a big group slot
 */
export const ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS: boolean = true;

/**
 * When a small group is still accepting new users it can become big, more than what the slot allows.
 * If this is set to fase a group stops receiving more users when the size is bigger han the slot max size.
 */
export const ALLOW_SMALL_GROUPS_BECOME_BIG: boolean = true;

/**
 * If a user has more connections than this number the exceeding connections will not be computed in the group analysis
 * algorithms.
 * This is important because in real life a person has time for a limited amount of people, so by setting this parameter
 * is possible to get more real life accurate group analysis.
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
 * If this is set to true, groups containing square shapes will be copied and the square shapes will be removed
 * in the copy. Later both versions of the groups are evaluated against each other to see which is better to be
 * finally created. If you consider that one type of group is better than the other and cannot be combined then
 * consider setting this to true.
 */
export const EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES: boolean = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////  GROUP QUALITY ANALYSIS  /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This value is equivalent to quality, and it's the minimum quality of groups allowed.
 * Explanation:
 * Metaconnections = The connections of your connections.
 * This value is the maximum allowed numeric distance between the connections of a user an the metaconnections
 * amounts in a range between 0 and 1.
 * In other words: "How much people I connect with and how much other people I have to "share" my connections".
 * Groups with a value higher than this will not be created and an attempt to fix them will be executed.
 *
 * For a reference this is a list of groups and their values, where for example: "3 for 5" means
 * that "3 users matches with 5 users":
 * 3 for 3: 0
 * 3 for 4: 0.14
 * 3 for 5: 0.25
 * 3 for 6: 0.33  // Too unbalanced it should not be allowed.
 * 3 for 7: 0.37  // Too unbalanced it should not be allowed.
 * 3 for 8: 0.40  // Too unbalanced it should not be allowed.
 *
 * 4 for 5: 0.11
 * 4 for 6: 0.20
 * 4 for 7: 0.26  // Too unbalanced it should not be allowed.
 * 4 for 8: 0.31  // Too unbalanced it should not be allowed.
 * 4 for 9: 0.35  // Too unbalanced it should not be allowed.
 *
 * 2 for 6: 0.50  // Too unbalanced it should not be allowed.
 */
export const MAX_CONNECTIONS_METACONNECTIONS_DISTANCE = 0.25;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////  CARDS GAME  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Maximum time since last login allowed, after this inactivity time the user no longer appears on the cards
 * recommendations until next login (unless the user ran out of recommendations and it's waiting to be notified).
 */
export const MAXIMUM_INACTIVITY_FOR_CARDS = ONE_MONTH_IN_SECONDS;

/**
 * The "searcher-liking" users (users that like the searcher user) should be order with priority in the cards game
 * to form more matches, but could be cases where the searcher-liking users are not attractive to the searcher, so
 * not all the cards should be searcher-liking users.
 *
 * Because of this the cards game will show a small amount of users (chunk) that don't like the searcher and after
 * that a chunk of searcher-liking users, this pattern is then repeated for the entire list of card game results.
 * The amount of cards on each chunk can be configured with these 2 numbers:
 */
export const SEARCHER_LIKING_CHUNK = 4;
export const NON_SEARCHER_LIKING_CHUNK = 4;

/**
 * If true, each pack of both chunks mentioned above will be shuffled to obfuscate the pattern to the users and
 * make the card game less predictable
 */
export const SHUFFLE_LIKING_NON_LIKING_RESULTS = true;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////  THEMES  /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This is the amount of themes a user can create in a time frame specified
 * in THEME_CREATION_LIMIT_TIME_FRAME
 */
export const THEMES_PER_TIME_FRAME = 4;

/**
 * The user needs to wait this time to create a new theme after reaching the creation limit
 * specified in THEMES_PER_TIME_FRAME
 */
export const THEME_CREATION_TIME_FRAME = WEEK_IN_SECONDS;

/**
 * A user can subscribe to this maximum amount of themes.
 * This prevents users from being in too many themes to get more visibility.
 */
export const MAX_THEME_SUBSCRIPTIONS_ALLOWED = 10;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  ERROR REPORTING  //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This is useful to debug group finder query which is a complex one but sucks processing power, disable if you
 * trust that the query and multithreading is working correctly.
 */
export const REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER: boolean = true;
export const REPORT_DATABASE_RETRYING: boolean = true;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SEARCH_GROUPS_FREQUENCY = hoursToMilliseconds(0.5);
export const NOTIFICATION_FREQUENCY_NEW_CARDS = hoursToMilliseconds(24);
export const FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY = hoursToMilliseconds(25);
export const MAX_CHAT_MESSAGES_STORED_ON_SERVER = 15;
export const CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING = 70;
export const CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS = 70;
export const MAX_TIME_TO_WAIT_ON_DATABASE_RETRY = 2048;

/**
 * NOT RECOMMENDED. This is faster but when the group finding takes too much time Gremlin fails with a timeout error.
 * If this is false the group finding sends many queries, takes much more time but it's safe.
 */
export const SINGLE_QUERY_GROUP_FINDER: boolean = false;

/**
 * This sends all the group finder queries at the same time, 100% of CPU is used on the database but finishes a
 * little faster. Could be useful in a multi instance configuration.
 * Only has effect if SINGLE_QUERY_GROUP_FINDER = false
 */
export const ENABLE_MULTITHREADING_IN_GROUP_FINDER: boolean = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  QUESTIONS  //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const companyQuestion: QuestionData = {
   questionId: 0,
   affectsCardsGameOrdering: false,
   text: 'If you go to a group date from this app, do you plan to go with someone?',
   shortVersion: 'Would go on the date with',
   answers: [
      {
         answerId: 0,
         text: 'Just me',
      },
      {
         answerId: 1,
         text: 'With my couple',
      },
   ],
};

const feminismQuestion: QuestionData = {
   questionId: 1,
   affectsCardsGameOrdering: true,
   text: 'Do you agree with feminism in general?',
   shortVersion: 'Agrees with feminism in general',
   answers: [
      {
         answerId: 0,
         text: 'Yes, I totally agree / I Almost totally agree',
      },
      {
         answerId: 1,
         text: "I Don't agree very much / I do not agree at all",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

const groupSexQuestion: QuestionData = {
   questionId: 2,
   affectsCardsGameOrdering: true,
   text: "The term 'Group sex' what makes you think?",
   shortVersion: 'Thoughts about group sex',
   answers: [
      {
         answerId: 0,
         text: "I don't know / No comments",
      },
      {
         answerId: 1,
         text: "I'm interested",
      },
      {
         answerId: 2,
         text: "I'm not very interested / Zero interest",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [0, 2],
      2: [1],
   },
};

/*
const politicsQuestion: QuestionData = {
   questionId: 3,
   affectsCardsGameOrdering: false,
   text: '¿Qué grupo de posturas políticas preferís?',
   shortVersion: 'Posturas políticas preferidas',
   answers: [
      {
         answerId: 0,
         text: 'Prefiero no decirlo',
      },
      {
         answerId: 1,
         text: 'Libre mercado / Derecha / Otras cercanas',
         shortVersion: 'Libre mercado / Derecha / Otras',
      },
      {
         answerId: 2,
         text: 'Socialismo / Izquierda / Anarquismo / Otras cercanas',
         shortVersion: 'Izquierda / Anarquismo / Otras',
      },
      {
         answerId: 3,
         text: 'Otra',
      },
   ],
   incompatibilitiesBetweenAnswers: {
      1: [2],
      2: [1],
   },
};
*/

export const QUESTIONS: QuestionData[] = [
   feminismQuestion,
   // politicsQuestion,
   groupSexQuestion,
   companyQuestion,
];
