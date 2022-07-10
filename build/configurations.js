"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENABLE_MULTITHREADING_IN_GROUP_FINDER = exports.SINGLE_QUERY_GROUP_FINDER = exports.SMALL_IMAGE_SIZE = exports.BIG_IMAGE_SIZE = exports.MAX_FILE_SIZE_UPLOAD_ALLOWED = exports.MAX_TIME_TO_WAIT_ON_DATABASE_RETRY = exports.CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS = exports.CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING = exports.FIND_INACTIVE_GROUPS_CHECK_FREQUENCY = exports.FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY = exports.SEARCH_GROUPS_FREQUENCY = exports.DEFAULT_LANGUAGE = exports.PUSH_NOTIFICATION_CHANNELS = exports.SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY = exports.SECOND_DATE_REMINDER_TIME = exports.FIRST_DATE_REMINDER_TIME = exports.QUESTIONS = exports.APP_AUTHORED_TAGS = exports.MAX_TAG_SUBSCRIPTIONS_ALLOWED = exports.TAG_CREATION_TIME_FRAME = exports.TAGS_PER_TIME_FRAME = exports.ALWAYS_SHOW_REMOVE_SEEN_MENU = exports.REQUIRE_REMOVE_SEEN_MENU = exports.SHUFFLE_LIKING_NON_LIKING_RESULTS = exports.NON_SEARCHER_LIKING_CHUNK = exports.SEARCHER_LIKING_CHUNK = exports.MAXIMUM_INACTIVITY_FOR_CARDS = exports.MAX_CONNECTIONS_METACONNECTIONS_DISTANCE = exports.EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES = exports.MAXIMUM_INACTIVITY_FOR_NEW_GROUPS = exports.MAX_WEEKEND_DAYS_VOTE_OPTIONS = exports.MAX_CONNECTIONS_POSSIBLE_IN_REALITY = exports.ALLOW_SMALL_GROUPS_BECOME_BIG = exports.ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS = exports.CREATE_BIGGER_GROUPS_FIRST = exports.GROUP_ACTIVE_TIME = exports.MAX_TIME_GROUPS_RECEIVE_NEW_USERS = exports.FORM_BAD_QUALITY_GROUPS_TIME = exports.SEARCH_BAD_QUALITY_GROUPS = exports.GROUP_SLOTS_CONFIGS = exports.MINIMUM_CONNECTIONS_TO_BE_ON_GROUP = exports.MAX_GROUP_SIZE = exports.MIN_GROUP_SIZE = exports.USERS_API_PATH = exports.MINIMUM_CLIENT_BUILD_VERSION_ALLOWED = exports.MINIMUM_CLIENT_CODE_VERSION_ALLOWED = exports.APP_STORE_URL = exports.GOOGLE_PLAY_URL = exports.APPLICATION_NAME_COMPLETE = exports.APPLICATION_NAME = void 0;
exports.DEMO_ACCOUNTS = exports.LOG_PUSH_NOTIFICATION_DELIVERING_RESULT = exports.LOG_IMAGE_ACCESS = exports.LOG_ROUTE_ACCESS = exports.REPORT_DATABASE_RETRYING = exports.REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER = exports.LOG_USAGE_REPORT_FREQUENCY = exports.BACKUP_LOGS_TO_FILE_FREQUENCY = exports.ENABLE_PUSH_AND_EMAIL_NOTIFICATIONS_ON_DEBUG_MODE = exports.RATE_LIMITER_CACHE_CLEAR_INTERVAL = exports.DATABASE_BACKUP_HOUR = exports.DATABASE_BACKUP_MONTHLY = exports.DATABASE_BACKUP_WEEKLY = exports.DATABASE_BACKUP_DAILY = void 0;
const appRoot = require("app-root-path");
const i18n = require("i18n");
const moment = require("moment");
const path = require("path");
const constants_1 = require("./common-tools/math-tools/constants");
const general_1 = require("./common-tools/math-tools/general");
const user_1 = require("./shared-tools/endpoints-interfaces/user");
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////  BASICS  //////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The name of the application to show to the users.
exports.APPLICATION_NAME = "GroupDate";
exports.APPLICATION_NAME_COMPLETE = "GroupDate - Non-monogamy group dating"; // Translated on usage
exports.GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.poly.dates";
exports.APP_STORE_URL = "https://apps.apple.com/app/groupdate-polyamory-dating/id1610688573";
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  CLIENT  /////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
 * Versions of the client allowed to connect to the server
 */
exports.MINIMUM_CLIENT_CODE_VERSION_ALLOWED = "1.4.5";
exports.MINIMUM_CLIENT_BUILD_VERSION_ALLOWED = "1.4.3";
/**
 * If you change this you also have to change it in:
 *    - The api calls of the email-login website
 *    - Dashboard api calls
 *    - Mobile app api calls
 *    - All client apps making requests to the api.
 */
exports.USERS_API_PATH = "/api";
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
exports.MIN_GROUP_SIZE = 3;
exports.MAX_GROUP_SIZE = 18;
/**
 * The required amount of matches to have with members of a group in order to become part of it
 */
exports.MINIMUM_CONNECTIONS_TO_BE_ON_GROUP = 2;
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
exports.GROUP_SLOTS_CONFIGS = [
    {
        maximumSize: 6,
        amount: 1,
        releaseTime: constants_1.WEEK_IN_SECONDS * 3,
    },
    {
        minimumSize: 7,
        amount: 1,
        releaseTime: constants_1.WEEK_IN_SECONDS * 2,
    },
];
/**
 * NOT TESTED FEATURE, NOT READY FOR PRODUCTION: It probably doesn't work or has bad performance.
 *
 * When users are not in groups for a long time they can be allowed to be on "bad quality groups".
 * Bad quality group is a group where all members only have 2 matches forming rectangle or circle
 * shapes in a graph.
 */
exports.SEARCH_BAD_QUALITY_GROUPS = false;
/**
 * NOT TESTED FEATURE, NOT READY FOR PRODUCTION: It probably doesn't work or has bad performance.
 *
 * Bad quality groups are groups where each user only has 2 matches, these groups are probably less interesting
 * so only appears to users that don't have a group in a long time, that time is this setting.
 *
 * This option is only enabled if SEARCH_BAD_QUALITY_GROUPS = true
 */
exports.FORM_BAD_QUALITY_GROUPS_TIME = constants_1.WEEK_IN_SECONDS * 6;
/**
 * After a group is created and the members are interacting it can still receive new users until a time passed.
 * Too high times in this setting is dangerous because there is a possible situation where members are added
 * after too much time where the group already met in person, this is serious since late arriving users will not
 * see the matching members of the group in person and will not form group with them again because the members
 * are now "seen matches". So it's a good idea to keep this setting low.
 */
exports.MAX_TIME_GROUPS_RECEIVE_NEW_USERS = constants_1.DAY_IN_SECONDS * 2;
/**
 * The time a group is considered active (in seconds). An inactive group currently involves only 2 things:
 * 1) Can potentially be displayed more hidden in the client app.
 * 2) When the group becomes inactive all users receive a task where they have to choose who in the group
 *    they want to see again in future group matches.
 */
exports.GROUP_ACTIVE_TIME = constants_1.WEEK_IN_SECONDS * 4;
/**
 * If true will create bigger groups first, the result is more bigger groups.
 * If false it will create quality groups first, the result will be less bigger groups but better quality.
 * Quality means more matches between members and better distribution of them.
 */
exports.CREATE_BIGGER_GROUPS_FIRST = true;
/**
 * When searching for small groups and finds a big group:
 * true = Use the small group slot to store the big group
 * false = Discard the big group until all users has a big group slot
 */
exports.ALLOW_BIGGER_GROUPS_TO_USE_SMALLER_SLOTS = true;
/**
 * When a small group is still accepting new users it can become big, more than what the slot allows.
 * If this is set to fase a group stops receiving more users when the size is bigger han the slot max size.
 */
exports.ALLOW_SMALL_GROUPS_BECOME_BIG = true;
/**
 * If a user has more connections than this number the exceeding connections will not be computed in the group analysis
 * algorithms.
 * This is important because in real life a person has time for a limited amount of people, so by setting this parameter
 * is possible to get more real life accurate group analysis.
 */
exports.MAX_CONNECTIONS_POSSIBLE_IN_REALITY = 6;
/**
 * Maximum amount of options to vote the day of the date.
 */
exports.MAX_WEEKEND_DAYS_VOTE_OPTIONS = 12;
/**
 * Maximum time (in seconds) since last login allowed, after this inactivity time the user is no longer part of
 * new groups searching until next login.
 */
exports.MAXIMUM_INACTIVITY_FOR_NEW_GROUPS = constants_1.ONE_MONTH_IN_SECONDS;
/**
 * If this is set to true, groups containing square shapes will be copied and the square shapes will be removed
 * in the copy. Later both versions of the groups are evaluated against each other to see which is better to be
 * finally created. If you consider that one type of group is better than the other and cannot be combined then
 * consider setting this to true.
 */
exports.EVALUATE_GROUPS_AGAIN_REMOVING_SQUARES = false;
/**
 * This value is equivalent to quality, and it's the minimum quality of groups allowed.
 * The following is an explanation of this concept.
 *
 * Terminology:
 * Connections = When the users like each other (same than "Match" in monogamy apps)
 * Metaconnections = The connections of your connections within the group
 *
 * So this value is the maximum allowed numeric distance between the connections of a user and the metaconnections
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
exports.MAX_CONNECTIONS_METACONNECTIONS_DISTANCE = 0.25;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////  CARDS GAME  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Maximum time since last login allowed, after this inactivity time the user no longer appears on the cards
 * recommendations until next login (unless the user ran out of recommendations and it's waiting to be notified).
 */
exports.MAXIMUM_INACTIVITY_FOR_CARDS = constants_1.ONE_MONTH_IN_SECONDS;
/**
 * The "searcher-liking" users (users that like the searcher user) should be order with priority in the cards game
 * to form more matches, but could be cases where the searcher-liking users are not attractive to the searcher, so
 * not all the cards should be searcher-liking users.
 *
 * Because of this the cards game will show a small amount of users (chunk) that don't like the searcher and after
 * that a chunk of searcher-liking users, this pattern is then repeated for the entire list of card game results.
 * The amount of cards on each chunk can be configured with these 2 numbers:
 */
exports.SEARCHER_LIKING_CHUNK = 4;
exports.NON_SEARCHER_LIKING_CHUNK = 4;
/**
 * If true, each pack of both chunks mentioned above will be shuffled to obfuscate the pattern to the users and
 * make the card game less predictable
 */
exports.SHUFFLE_LIKING_NON_LIKING_RESULTS = true;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////  GROUPS  ////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * If this is set to true when a group becomes inactive all group members are required to choose who in the group
 * they want to see again in the future group matches, this is called "Remove seen menu".
 * For the moment we are disabling the remove seen menu since it can cause more harm than good.
 *
 * Advantages:
 *    1. Users that could not assist to the date can meet the members in future dates (but they can also join in a second meeting they can organize by themselves since they can talk now).
 *    2. Users can exclude a miss behaving member voting to see each other again all with all except this member (this can also be done when moving to WhatsApp group which is faster and easier to organize)
 *
 * Disadvantages:
 *    1. Users that already know and understand each other can be in dates with new people generating a hierarchy, hierarchies are what ruins everything in life
 *    2. This can potentially be used by a group of hackers or rapists to match each other and also with a single victim (is hard to do but could be possible with the remove seen menu)
 */
exports.REQUIRE_REMOVE_SEEN_MENU = false;
/**
 * If this is set to true the remove seen menu can be accessed all the time in the group menu.
 */
exports.ALWAYS_SHOW_REMOVE_SEEN_MENU = false;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////  TAGS  //////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the amount of tags a user can create in a time frame specified
 * in TAG_CREATION_LIMIT_TIME_FRAME
 */
exports.TAGS_PER_TIME_FRAME = 2;
/**
 * The user needs to wait this time to create a new tag after reaching the creation limit
 * specified in TAGS_PER_TIME_FRAME
 */
exports.TAG_CREATION_TIME_FRAME = constants_1.WEEK_IN_SECONDS;
/**
 * A user can subscribe to this maximum amount of tags.
 * This prevents users from being in too many tags to get more visibility.
 * Also forces the users to take the tags more seriously.
 */
exports.MAX_TAG_SUBSCRIPTIONS_ALLOWED = 10;
/**
 * These are the "app authored" tags. The key of this object is the tagId, you have to create it here, can be any string.
 * These tags will be created when the server boots if they don't exist. This tags can be visible in the tags menu or not with the visible prop.
 * If the tags are visible in the tags menu it will have a special category that makes them more visible than the ones created by users.
 * If you don't add the visible prop ir will be invisible by default.
 * Also the tags can be invisible and used in the registration questions.
 * Don't use quotes in the keys so typescript can do it's job.
 */
exports.APP_AUTHORED_TAGS = {
    couple: {
        name: "Couple",
        category: "App usage",
    },
    unicornHunters: {
        name: "Unicorn hunters",
        category: "App usage",
    },
    groupDate: {
        name: "Desired date: Group date",
        category: "App usage",
    },
    only3: {
        name: "Desired date: Only 3 people",
        category: "App usage",
    },
    withSomeone: {
        name: "Desired date: With someone",
        category: "App usage",
    },
    sexDirectly: {
        name: "Date activity: Sex directly",
        category: "App usage",
    },
    anyActivity: {
        name: "Date activity: Any activity",
        category: "App usage",
    },
    feminism: {
        name: "Feminism",
        category: "Ideas",
    },
    antiFeminist: {
        name: "Feminism: I Don't agree",
        category: "Ideas",
    },
    /**
     * These ideology tags are not needed for the moment, it seems almost all people interested in group polyamory are leftists. Right-wing media seems to not
     * want to mention group relationships because it's a collective idea and that is philosophically left-wing by definition.
     *
      aat0: {
          name: "Left-wing",
          category: "Ideas",
          visible: true,
       },
       aat1: {
          name: "Right-wing",
          category: "Ideas",
          visible: true,
       },
    */
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////  USER REGISTRATION  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * The following are the registration questions. Also the questions can be showed when changing settings. You can
 * specify if an answer changes user props, subscribes the user to a tag, blocks a tag, answers other questions
 * automatically (you can do a tree of questions) or does all mentioned things at the same time.
 *
 * When you set the question to subscribe to a tag it needs to be a tag present on the APP_AUTHORED_TAGS.
 * When you create a new question you have to create some ids like: questionId, answerId, can be any
 * string just make sure all are different, these ids can be referenced in other questions for auto responses.
 *
 * Localization is executed already, you just need to add the strings in english here and then add the translation in the
 * corresponding language file.
 *
 * When you finish creating a new question add it to SETTINGS_AS_QUESTIONS, there you can specify the order in which
 * the questions will be shown, if a question A has an answer that automatically answers question B
 * (with answersOtherQuestions prop) then you need to add answer A before answer B in the mentioned SETTINGS_AS_QUESTIONS array.
 *
 * New questions added will be shown to the user when they boot the app.
 *
 * If you make a change on a question and want all the users to be affected by the new change, one way to solve this problem is
 * by changing the id of que question, that forces the user to answer that question again when they boot the app, like if it's
 * a new question.
 */
const isCoupleProfileQuestion = {
    text: "If you go to a group date from this app, do you plan to go with someone?",
    questionId: "q05",
    answers: [
        {
            text: "Just me",
            answerId: "justMe",
            setsUserProp: [{ propName: "isCoupleProfile", valueToSet: false }],
            // This auto-answer will also block unicorn hunters:
            answersOtherQuestions: [{ questionId: "q06", answerId: "notUnicornHunters" }],
        },
        {
            text: "With my couple",
            answerId: "couple",
            subscribesToTags: [{ tagId: "couple" }],
            // For couples can be confusing to be asked about the date size because that size can or cannot include the partner. So we auto-answer that question with the answer that is less restrictive but not the one of the target users.
            answersOtherQuestions: [{ questionId: "taq-3-v2", answerId: "only3" }],
            setsUserProp: [
                { propName: "isCoupleProfile", valueToSet: true },
                // This is used in the frontend to disallow changing the answer too often. It's not added also to the other answer because changing from single profile to couple should be allowed always
                { propName: "coupleProfileLastChangeDate", valueToSet: () => moment().unix() },
            ],
        },
    ],
};
const unicornHunterQuestion = {
    text: "Have you installed the app to find a third person to join you?",
    extraText: "Invisible answer. It determines who you see first",
    questionId: "q06",
    answers: [
        {
            text: "Yes, we are here looking for a person to join us",
            answerId: "unicornHunters",
            subscribesToTags: [{ tagId: "unicornHunters" }],
            setsUserProp: [
                { propName: "isUnicornHunter", valueToSet: true },
                { propName: "unwantedUser", valueToSet: true },
            ],
        },
        {
            text: "No, we are interested in group relationships with many",
            answerId: "notUnicornHunters",
            blocksTags: [{ tagId: "unicornHunters" }],
        },
    ],
};
const dateTypeQuestion = {
    text: "What kind of date would you like?",
    questionId: "taq-3-v2",
    answers: [
        {
            text: "A date of 2, without anyone else",
            answerId: "withSomeone",
            subscribesToTags: [{ tagId: "withSomeone" }],
            setsUserProp: [{ propName: "unwantedUser", valueToSet: true }],
        },
        {
            text: "A date of 3, without anyone else",
            answerId: "only3",
            subscribesToTags: [{ tagId: "only3" }],
            blocksTags: [{ tagId: "withSomeone" }],
            setsUserProp: [{ propName: "unwantedUser", valueToSet: true }],
        },
        {
            text: "A group date where we like each other. Of 3, 4, 5 or more",
            answerId: "groupDate",
            subscribesToTags: [{ tagId: "groupDate" }],
            // Here couples are also blocked because the users that selects this answer are the target users of the app, they should not see couples because couples are not target users
            blocksTags: [{ tagId: "only3" }, { tagId: "withSomeone" }, { tagId: "couple" }],
        },
    ],
};
const usageIntentionQuestion = {
    questionId: "taq-4",
    text: "What are you looking for in a date in this app?",
    extraText: "Invisible answer. It determines who you see first",
    answers: [
        {
            text: "Sexual experiences without much ado",
            answerId: "sexDirectly",
            subscribesToTags: [{ tagId: "sexDirectly" }],
            setsUserProp: [{ propName: "unwantedUser", valueToSet: true }],
        },
        {
            text: "Have a good time with the activities that come up, sexual or not",
            answerId: "anyActivity",
            subscribesToTags: [{ tagId: "anyActivity" }],
            blocksTags: [{ tagId: "sexDirectly" }],
        },
    ],
};
const feminismQuestion = {
    questionId: "taq-0",
    text: "Do you agree with feminism in general?",
    extraText: "Invisible answer. It determines who you see first",
    answers: [
        {
            text: "I totally agree / I Almost totally agree",
            answerId: "feminism",
            subscribesToTags: [{ tagId: "feminism" }],
            blocksTags: [{ tagId: "antiFeminist" }],
        },
        {
            text: "I Don't agree very much / I do not agree at all",
            answerId: "antiFeminist",
            subscribesToTags: [{ tagId: "antiFeminist" }],
            setsUserProp: [{ propName: "unwantedUser", valueToSet: true }],
        },
    ],
};
exports.QUESTIONS = [
    isCoupleProfileQuestion,
    unicornHunterQuestion,
    dateTypeQuestion,
    feminismQuestion,
    usageIntentionQuestion,
];
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  NOTIFICATIONS  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Amount of time before the date to send the first reminder
 */
exports.FIRST_DATE_REMINDER_TIME = constants_1.DAY_IN_SECONDS * 3;
/**
 * Amount of time before the date to send the second reminder
 * The specific time of the day is not voted so the reminder also is limited because of that.
 */
exports.SECOND_DATE_REMINDER_TIME = constants_1.DAY_IN_SECONDS;
/**
 * How often to execute the search of groups to send the remainder notification to members
 */
exports.SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY = (0, general_1.hoursToMilliseconds)(5);
/**
 * To update a push notification channel you must also update NotificationChannelId.
 * This information is sent to the client in the server info endpoint so the device
 * registers the push notification channels (required un app settings).
 */
exports.PUSH_NOTIFICATION_CHANNELS = [
    {
        id: user_1.NotificationChannelId.Default,
        name: "General non frequent notifications",
    },
    {
        id: user_1.NotificationChannelId.ChatMessages,
        name: "New group chat messages",
    },
    {
        id: user_1.NotificationChannelId.Events,
        name: "Polyamory organizations' events and parties near you",
    },
    {
        id: user_1.NotificationChannelId.NewUsers,
        name: "New users on the app",
    },
    {
        id: user_1.NotificationChannelId.DateReminders,
        name: "Reminder notification before the voted day of the group date",
    },
];
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  LOCALIZATION  /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.DEFAULT_LANGUAGE = "en";
i18n.configure({
    defaultLocale: exports.DEFAULT_LANGUAGE,
    directory: path.join(appRoot.path, "/locales/"),
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  PERFORMANCE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.SEARCH_GROUPS_FREQUENCY = (0, general_1.minutesToMilliseconds)(5); // In the final version this should be: hoursToMilliseconds(4)
exports.FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY = (0, general_1.hoursToMilliseconds)(24);
exports.FIND_INACTIVE_GROUPS_CHECK_FREQUENCY = (0, general_1.hoursToMilliseconds)(24);
exports.CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING = 70;
exports.CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS = 70;
exports.MAX_TIME_TO_WAIT_ON_DATABASE_RETRY = 2048;
// Image manipulation before saving:
exports.MAX_FILE_SIZE_UPLOAD_ALLOWED = 0.2 * 1024 * 1024; /// 1024 * 1024 converts mb to byte
exports.BIG_IMAGE_SIZE = 512;
exports.SMALL_IMAGE_SIZE = 64;
/**
 * NOT RECOMMENDED. This is faster but when the group finding takes too much time Gremlin fails with a timeout error.
 * If this is false the group finding sends many queries, takes much more time but it's safe.
 */
exports.SINGLE_QUERY_GROUP_FINDER = false;
/**
 * This sends all the group finder queries at the same time, 100% of CPU is used on the database but finishes a
 * little faster. Could be useful in a multi instance configuration.
 * Only has effect if SINGLE_QUERY_GROUP_FINDER = false
 */
exports.ENABLE_MULTITHREADING_IN_GROUP_FINDER = false;
/**
 * Stores a database backup for each day. For example monday.xml file will be replaced every monday and the same
 * for all the days of the week.
 */
exports.DATABASE_BACKUP_DAILY = true;
/**
 * Stores a database backup for each week. For example week1.xml file will be replaced every week. There will be
 * 4 backup files for each week of the month.
 */
exports.DATABASE_BACKUP_WEEKLY = true;
/**
 * Stores a database backup for each month. For example january.xml file will be replaced in the first day of
 * january and the same for all the months of the year, creating a maximum of 12 files.
 */
exports.DATABASE_BACKUP_MONTHLY = true;
/**
 * Hour of the day to make a database backups 0 = 00:00
 */
exports.DATABASE_BACKUP_HOUR = 0;
/**
 * How often the rate limiter cache is cleared.
 */
exports.RATE_LIMITER_CACHE_CLEAR_INTERVAL = (0, general_1.hoursToMilliseconds)(5);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////  DEBUGGING  ////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.ENABLE_PUSH_AND_EMAIL_NOTIFICATIONS_ON_DEBUG_MODE = false;
/**
 * Logs are saved into memory so when the server is restarted the logs are lost, to fix this there is an interval that saves the logs in memory to files.
 */
exports.BACKUP_LOGS_TO_FILE_FREQUENCY = (0, general_1.hoursToMilliseconds)(24);
/**
 * How often the server adds a log entry with information related to how many users are using the app and more.
 */
exports.LOG_USAGE_REPORT_FREQUENCY = (0, general_1.hoursToMilliseconds)(12);
/**
 * This is useful to debug group finder query which is a complex one. The disadvantage of this check is that sucks processing power, to improve performance
 * set this to false but only when you trust that the query and multithreading is working correctly.
 */
exports.REPORT_DATA_CORRUPTION_PROBLEMS_ON_GROUP_FINDER = true;
/**
 * Database retrying is important in "thread collisions", this reports such retries, disable if you trust
 * everything is working correctly regarding database queries.
 */
exports.REPORT_DATABASE_RETRYING = true;
/**
 * Logs into the console all endpoint requests, useful to check if the client is optimizing correctly the
 * amount of requests.
 */
exports.LOG_ROUTE_ACCESS = true;
exports.LOG_IMAGE_ACCESS = true;
exports.LOG_PUSH_NOTIFICATION_DELIVERING_RESULT = false;
/**
 * Google Play requires to setup demo accounts so they can do their testing and censorship bs.
 */
exports.DEMO_ACCOUNTS = [
    {
        email: "demo@demo.com",
        password: "demo",
        images: ["demo_image1"], // "demo_image1" is replaced in the client for a demo image. There are 4 demo images available.
    },
    {
        email: "demo2@demo2.com",
        password: "demo",
        images: ["demo_image2"],
    },
    {
        email: "demo3@demo3.com",
        password: "demo",
        images: ["demo_image3"],
    },
    {
        email: "demo4@demo4.com",
        password: "demo",
        images: ["demo_image4"],
    },
];
//# sourceMappingURL=configurations.js.map