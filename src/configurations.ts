import * as appRoot from "app-root-path";
import { I18n } from "i18n";
import * as path from "path";
import { DAY_IN_SECONDS, ONE_MONTH_IN_SECONDS, WEEK_IN_SECONDS } from "./common-tools/math-tools/constants";
import { hoursToMilliseconds } from "./common-tools/math-tools/general";
import { Slot } from "./components/groups-finder/tools/types";
import { Theme, ThemesAsQuestion } from "./shared-tools/endpoints-interfaces/themes";
import { Gender, UserPropAsQuestion } from "./shared-tools/endpoints-interfaces/user";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////  GROUP FINDER  //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The minimum and maximum size of the groups in the app.
 * The maximum is related with how confortable can be to have a date with too much people.
 * The minimum is related to an issue where statistically only half of the people that confirmed goes to the
 * date, this happens in general when organizing events online. So if the minimum group size is too low
 * the groups could be too broken when they meet each other.
 *
 * Note: For the moment we will set the minimum at 3 and see what happens.
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
 * "group slots", each slot can be reserved for a specific group size. It's recommended to configure 2 slots, one
 * for small groups and one for big groups so the only simultaneous experience possible is when the options are
 * very different experiences.
 * Also solves another problem: The bigger groups takes more time to form so they should have a reserved slot
 * available for the moment the group is formed.
 * Slots gets available again after a configurable time, in theory this should be the average time the users
 * take to finally meet so they become available again.
 *
 * Parameters:
 *
 *    @param minimumSize Don't set this value if the slot is the one handling the smaller groups.
 *    @param maximumSize Don't set this value if the slot is the one handling the bigger groups.
 *    @param amount If you want to configure the app to have multiple slots with the same group size, use this
 *                  property, don't duplicate slots
 *    @param releaseTime A group slot will be available again after a specific time set in this setting
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

/**
 * This value is equivalent to quality, and it's the minimum quality of groups allowed.
 * The following is an explanation of this concept.
 *
 * Terminology:
 * Connections = When the users like each other (same than "Match" in monogamy apps)
 * Metaconnections = The connections of your connections within the group
 *
 * So this value is the maximum allowed numeric distance between the connections of a user an the metaconnections
 * amounts in a range between 0 and 1.
 * In easier words: "How much people I connect with and how much other people I have to "share" my connections".
 * Groups with a value higher than this will not be created and an attempt to fix them by will be executed.
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
////////////////////////////////////////////////////  THEMES  ////////////////////////////////////////////////////
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

/**
 * These are the "app authored" themes. The themeId can be any string but all should be different for each theme here.
 */
const politicsLeftTheme: Partial<Theme> = {
   themeId: "aat0",
   category: "Politics",
   name: "Left-wing / Socialism / Anarchism / Other close",
};

const politicsRightTheme: Partial<Theme> = {
   themeId: "aat1",
   category: "Politics",
   name: "Right-wing / Free market ideas",
};

/**
 * These are the "app authored" themes that will be shown as questions and are mandatory to interact on registration.
 * The themeId can be any string but all should be different for each theme here.
 */
const feminismQuestion: ThemesAsQuestion = {
   questionId: "taq-0",
   text: "Do you agree with feminism in general?",
   answers: [
      {
         themeId: "q00-a00",
         text: "I totally agree / I Almost totally agree",
         themeName: "Feminism: Agree",
      },
      {
         themeId: "q00-a01",
         text: "I Don't agree very much / I do not agree at all",
         themeName: "Feminism: I Don't agree very much",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

const groupSexQuestion: ThemesAsQuestion = {
   questionId: "taq-1",
   text: "Are group sex situations one of your motivations to use the app?",
   answers: [
      {
         themeId: "q01-a00",
         text: "Yes / Could be",
         themeName: "Group sex: Yes / Could be",
      },
      {
         themeId: "q01-a01",
         text: "No / I don't know",
         themeName: "Group sex: Not interested",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

// This question may not be required because interest for group sex (the other question) includes the physical interaction intentions
const spamQuestion: ThemesAsQuestion = {
   questionId: "taq-2",
   text: "Is your goal in this app to meet new people?",
   answers: [
      {
         themeId: "q02-a01",
         text: "Yes, meet new people",
         themeName: "App usage: Meet new people",
      },
      {
         themeId: "q02-a00",
         text: "No, other goal. For example: Get followers, promote something, etc.",
         themeName: "App usage: Get followers, promote, etc.",
      },
   ],
   incompatibilitiesBetweenAnswers: {
      0: [1],
      1: [0],
   },
};

export const APP_AUTHORED_THEMES_AS_QUESTIONS: ThemesAsQuestion[] = [
   feminismQuestion,
   groupSexQuestion,
   spamQuestion,
];
export const APP_AUTHORED_THEMES: Array<Partial<Theme>> = [politicsLeftTheme, politicsRightTheme];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////  USER REGISTRATION  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const genderQuestion: UserPropAsQuestion<Gender> = {
   text: "What is your gender?",
   shortVersion: "Gender",
   answers: [
      {
         text: "Woman",
         propName: "gender",
         value: Gender.Woman,
      },
      {
         text: "Man",
         propName: "gender",
         value: Gender.Man,
      },
      {
         text: "Trans woman",
         propName: "gender",
         value: Gender.TransgenderWoman,
      },
      {
         text: "Trans man",
         propName: "gender",
         value: Gender.TransgenderMan,
      },
      {
         text: "Other / Non binary",
         propName: "gender",
         value: Gender.Other,
      },
   ],
};

const genderLikeQuestion: UserPropAsQuestion<boolean> = {
   text: "What genders are you attracted to?",
   shortVersion: "Attracted to",
   multipleAnswersAllowed: true,
   answers: [
      {
         text: "Women",
         propName: "likesWoman",
         value: true,
      },
      {
         text: "Men",
         propName: "likesMan",
         value: true,
      },
      {
         text: "Trans women",
         propName: "likesWomanTrans",
         value: true,
      },
      {
         text: "Trans men",
         propName: "likesManTrans",
         value: true,
      },
      {
         text: "Others / Non binary",
         propName: "likesOtherGenders",
         value: true,
      },
   ],
};

const isCoupleProfileQuestion: UserPropAsQuestion<boolean> = {
   text: "If you go to a group date from this app, do you plan to go with someone?",
   shortVersion: "Would go on the date with",
   answers: [
      {
         text: "Just me",
         propName: "isCoupleProfile",
         value: false,
      },
      {
         text: "With my couple",
         propName: "isCoupleProfile",
         value: true,
      },
   ],
};

// When adding a new question make sure it has a unique questionId number
export const USER_PROPS_AS_QUESTIONS: Array<UserPropAsQuestion> = [
   genderQuestion,
   genderLikeQuestion,
   isCoupleProfileQuestion,
];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  NOTIFICATIONS  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * When the user ignores a notification of new chat messages then no more notifications of this kind
 * are sent to the user unless this amount of time passes
 */
export const NEW_MESSAGE_NOTIFICATION_INSISTING_INTERVAL = DAY_IN_SECONDS * 2;

/**
 * Amount of time before the date to send the first reminder
 */
export const FIRST_DATE_REMINDER_TIME = DAY_IN_SECONDS * 3;

/**
 * Amount of time before the date to send the second reminder
 * The specific time of the day is not voted so the reminder also is limited because of that.
 */
export const SECOND_DATE_REMINDER_TIME = DAY_IN_SECONDS;

/**
 * How often to execute the search of groups to send the remainder notification to members
 */
export const SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY = hoursToMilliseconds(5);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  LOCALIZATION  /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const DEFAULT_LANGUAGE = "en";
export const I18N = new I18n({
   defaultLocale: DEFAULT_LANGUAGE,
   directory: path.join(appRoot.path, "/locales/"),
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SEARCH_GROUPS_FREQUENCY = hoursToMilliseconds(0.5);
export const NEW_CARDS_NOTIFICATION_CHECK_FREQUENCY = hoursToMilliseconds(24);
export const FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY = hoursToMilliseconds(25);
export const MAX_CHAT_MESSAGES_STORED_ON_SERVER = 15;
export const CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING = 70;
export const CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS = 70;
export const MAX_TIME_TO_WAIT_ON_DATABASE_RETRY = 2048;

// Image manipulation before saving:
export const MAX_FILE_SIZE_UPLOAD_ALLOWED = 0.2 * 1024 * 1024; /// 1024 * 1024 converts mb to byte
export const BIG_IMAGE_SIZE = 512;
export const SMALL_IMAGE_SIZE = 64;

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
/////////////////////////////////////////////////  ERROR REPORTING  //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This is useful to debug group finder query which is a complex one but sucks processing power, disable if you
 * trust that the query and multithreading is working correctly.
 */
export const REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER: boolean = true;
export const REPORT_DATABASE_RETRYING: boolean = true;
