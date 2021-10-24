"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlotIdFromUsersAmount = exports.sendDateReminderNotifications = exports.findSlotsToRelease = exports.feedbackPost = exports.chatPost = exports.voteResultGet = exports.chatUnreadAmountGet = exports.chatGet = exports.dateDayVotePost = exports.dateIdeaVotePost = exports.groupSeenPost = exports.userGroupsGet = exports.groupGet = exports.addUsersToGroup = exports.getGroupById = exports.createGroup = exports.initializeGroups = void 0;
const moment = require("moment");
const dynamic_1 = require("set-interval-async/dynamic");
const configurations_1 = require("../../configurations");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const models_1 = require("../user/models");
const queries_1 = require("./queries");
const queries_2 = require("./queries");
const data_conversion_1 = require("./tools/data-conversion");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
async function initializeGroups() {
    (0, dynamic_1.setIntervalAsync)(findSlotsToRelease, configurations_1.FIND_SLOTS_TO_RELEASE_CHECK_FREQUENCY);
    (0, dynamic_1.setIntervalAsync)(sendDateReminderNotifications, configurations_1.SEARCH_GROUPS_TO_SEND_REMINDER_FREQUENCY);
}
exports.initializeGroups = initializeGroups;
/**
 * Internal function to create a group (this is not an endpoint)
 * @param initialUsers The initial users to add and the
 */
async function createGroup(initialUsers, initialQuality) {
    const dayOptions = getComingWeekendDays(configurations_1.MAX_WEEKEND_DAYS_VOTE_OPTIONS).map(date => ({
        date,
        votersUserId: [],
    }));
    const resultGroup = await (0, data_conversion_1.fromQueryToGroup)((0, queries_2.queryToCreateGroup)({ dayOptions, initialUsers, initialQuality }), false, true);
    await (0, queries_2.queryToUpdateGroupProperty)({ groupId: resultGroup.groupId, name: generateGroupName(resultGroup) });
    // Send notifications
    for (const userId of initialUsers.usersIds) {
        await (0, models_1.addNotificationToUser)({ userId }, {
            type: user_1.NotificationType.Group,
            title: "You are in a group!",
            text: "A group just formed and you like each other!",
            targetId: resultGroup.groupId,
        }, { sendPushNotification: true, translateNotification: true });
    }
    return resultGroup;
}
exports.createGroup = createGroup;
/**
 * Internal function to get a group by Id (this is not an endpoint)
 */
async function getGroupById(groupId, { includeFullDetails = false, protectPrivacy = true, filters, ctx } = {}) {
    const groupTraversal = (0, queries_2.queryToGetGroupById)(groupId, filters);
    const result = await (0, data_conversion_1.fromQueryToGroup)(groupTraversal, protectPrivacy, includeFullDetails);
    if (result == null && ctx != null) {
        ctx.throw(400, (0, i18n_tools_1.t)("Group not found", { ctx }));
        return;
    }
    return result;
}
exports.getGroupById = getGroupById;
/**
 * Add users to a group (this is not an endpoint)
 */
async function addUsersToGroup(groupId, users) {
    const group = await (0, data_conversion_1.fromQueryToGroup)((0, queries_2.queryToAddUsersToGroup)((0, queries_2.queryToGetGroupById)(groupId), users), true, true);
    await (0, queries_2.queryToUpdateGroupProperty)({ groupId: group.groupId, name: generateGroupName(group) });
    // Send notifications:
    for (const userId of users.usersIds) {
        await (0, models_1.addNotificationToUser)({ userId }, {
            type: user_1.NotificationType.Group,
            title: "You are in a group!",
            text: "A group just formed and you like each other!",
            targetId: group.groupId,
        }, { sendPushNotification: true, translateNotification: true });
    }
}
exports.addUsersToGroup = addUsersToGroup;
/**
 * Endpoints to get a specific group that the user is part of.
 */
async function groupGet(params, ctx) {
    const group = await getGroupById(params.groupId, {
        filters: { onlyIfAMemberHasToken: params.token },
        includeFullDetails: true,
        ctx,
    });
    return group;
}
exports.groupGet = groupGet;
/**
 * Endpoint to get all the groups the user is part of.
 */
async function userGroupsGet(params, ctx, fullInfo) {
    return (0, data_conversion_1.fromQueryToGroupList)((0, queries_2.queryToGetAllGroupsOfUser)(params.token), true, fullInfo !== null && fullInfo !== void 0 ? fullInfo : false);
}
exports.userGroupsGet = userGroupsGet;
async function groupSeenPost(params, ctx) {
    const group = await (0, data_conversion_1.fromQueryToGroup)((0, queries_2.queryToGetGroupById)(params.groupId, {
        onlyIfAMemberHasToken: params.token,
        onlyIfAMemberHasUserId: params.userId,
    }), true, false);
    const seenBy = [...group.seenBy];
    if (!seenBy.includes(params.userId)) {
        seenBy.push(params.userId);
    }
    await (0, queries_2.queryToUpdateGroupProperty)({ seenBy, groupId: group.groupId });
}
exports.groupSeenPost = groupSeenPost;
/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
async function dateIdeaVotePost(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    const traversal = (0, queries_2.queryToVoteDateIdeas)((0, queries_2.queryToGetGroupById)(params.groupId, { onlyIfAMemberHasToken: params.token }), user.userId, params.ideasToVoteAuthorsIds);
    const group = await (0, data_conversion_1.fromQueryToGroup)(traversal, false, true);
    // Get the most voted idea:
    let mostVotedIdea = null;
    group.dateIdeasVotes.forEach(idea => {
        var _a, _b;
        if (mostVotedIdea == null || ((_a = idea === null || idea === void 0 ? void 0 : idea.votersUserId) === null || _a === void 0 ? void 0 : _a.length) > ((_b = mostVotedIdea === null || mostVotedIdea === void 0 ? void 0 : mostVotedIdea.votersUserId) === null || _b === void 0 ? void 0 : _b.length)) {
            mostVotedIdea = idea;
        }
    });
    if (mostVotedIdea != null) {
        await (0, queries_2.queryToUpdateGroupProperty)({ groupId: group.groupId, mostVotedIdea: mostVotedIdea.ideaOfUser });
    }
}
exports.dateIdeaVotePost = dateIdeaVotePost;
/**
 * In this endpoint the user sends an array with the options he/she wants to vote. Votes saved
 * from this user on a previous api call will be removed if the votes are not present in this
 * new call, this is the way to remove a vote.
 */
async function dateDayVotePost(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    const group = await getGroupById(params.groupId, {
        filters: { onlyIfAMemberHasToken: params.token },
        ctx,
    });
    let mostVotedDate = null;
    let mostVotedDateVotes = 0;
    for (const groupDayOption of group.dayOptions) {
        const userIsVotingThisOption = params.daysToVote.indexOf(groupDayOption.date) !== -1;
        const userIdPosOnVotes = groupDayOption.votersUserId.indexOf(user.userId);
        const optionAlreadyVoted = userIdPosOnVotes !== -1;
        if (userIsVotingThisOption) {
            if (!optionAlreadyVoted) {
                groupDayOption.votersUserId.push(user.userId);
            }
        }
        else {
            // Remove the user vote if it is there from a previous api call
            if (optionAlreadyVoted) {
                groupDayOption.votersUserId.splice(userIdPosOnVotes, 1);
            }
        }
        // Save the most voted date
        if (mostVotedDate == null || groupDayOption.votersUserId.length > mostVotedDateVotes) {
            mostVotedDate = groupDayOption.date;
            mostVotedDateVotes = groupDayOption.votersUserId.length;
        }
    }
    await (0, queries_2.queryToUpdateGroupProperty)({ groupId: group.groupId, dayOptions: group.dayOptions, mostVotedDate });
}
exports.dateDayVotePost = dateDayVotePost;
/**
 * Optimized endpoint to get the chat value of the group and register the messages as read. This endpoint
 * is optimized as much as possible, so it doesn't parse the chat so the response can be faster and parsing is
 * done on the client, this means the returned value is a string to be parsed by the client.
 * The client receives a json string as usual so there is no difference, the difference is when this function
 * is called inside the server, the response it's not already parsed like the others.
 */
async function chatGet(params, ctx) {
    let traversal = (0, queries_2.queryToGetGroupById)(params.groupId, { onlyIfAMemberHasToken: params.token });
    traversal = (0, queries_1.queryToUpdatedReadMessagesAmount)(traversal, params.token, { returnGroup: false });
    traversal = (0, queries_1.queryToUpdateMembershipProperty)(traversal, params.token, { newMessagesRead: true }, { fromGroup: false });
    return await (0, data_conversion_tools_1.fromQueryToSpecificPropValue)(traversal, "chat");
}
exports.chatGet = chatGet;
async function chatUnreadAmountGet(params, ctx) {
    var _a, _b;
    let traversal = (0, queries_2.queryToGetGroupById)(params.groupId, { onlyIfAMemberHasToken: params.token });
    traversal = (0, queries_1.queryToGetReadMessagesAndTotal)(traversal, params.token);
    const result = (0, data_conversion_tools_1.fromGremlinMapToObject)((await (0, database_manager_1.sendQuery)(() => traversal.next())).value);
    return { unread: ((_a = result === null || result === void 0 ? void 0 : result.total) !== null && _a !== void 0 ? _a : 0) - ((_b = result === null || result === void 0 ? void 0 : result.read) !== null && _b !== void 0 ? _b : 0) };
}
exports.chatUnreadAmountGet = chatUnreadAmountGet;
async function voteResultGet(params, ctx) {
    let traversal = (0, queries_2.queryToGetGroupById)(params.groupId, { onlyIfAMemberHasToken: params.token });
    const result = await (0, data_conversion_tools_1.fromQueryToSpecificProps)(traversal, [
        "mostVotedDate",
        "mostVotedIdea",
    ]);
    return result;
}
exports.voteResultGet = voteResultGet;
/**
 * Endpoint to send a chat message to a group
 */
async function chatPost(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    const group = await getGroupById(params.groupId, {
        filters: { onlyIfAMemberHasToken: params.token },
        includeFullDetails: false,
        ctx,
    });
    group.chat.messages.push({
        chatMessageId: (0, string_tools_1.generateId)(),
        messageText: params.message,
        time: moment().unix(),
        authorUserId: user.userId,
    });
    await (0, queries_2.queryToUpdateGroupProperty)({
        groupId: group.groupId,
        chat: group.chat,
        chatMessagesAmount: group.chat.messages.length,
    });
    // Send a notification to group members informing that there is a new message
    const usersToReceiveNotification = (await (0, queries_1.queryToGetMembersForNewMsgNotification)(group.groupId, user.userId)
        .values("userId")
        .toList());
    for (const userId of usersToReceiveNotification) {
        await (0, models_1.addNotificationToUser)({ userId }, {
            type: user_1.NotificationType.Chat,
            title: "New chat messages",
            text: "There are new chat messages in your group date",
            targetId: group.groupId,
            // Previous notifications that has the same value here are replaced
            idForReplacement: group.groupId,
        }, {
            sendPushNotification: true,
            channelId: user_1.NotificationChannelId.ChatMessages,
            translateNotification: true,
        });
    }
}
exports.chatPost = chatPost;
/**
 * Endpoint to send feedback about a group experience
 */
async function feedbackPost(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    const group = await getGroupById(params.groupId, {
        filters: { onlyIfAMemberHasToken: params.token },
        protectPrivacy: false,
        ctx,
    });
    if (group.feedback.find(f => f.userId === user.userId) == null) {
        group.feedback.push({
            userId: user.userId,
            feedbackType: params.feedback.feedbackType,
            description: params.feedback.description,
        });
        await (0, queries_2.queryToUpdateGroupProperty)({ groupId: group.groupId, feedback: group.feedback });
    }
}
exports.feedbackPost = feedbackPost;
async function findSlotsToRelease() {
    const porfiler = logTimeToFile("groupsTasks");
    await (0, queries_1.queryToFindSlotsToRelease)().iterate();
    porfiler.done("Find slots to release finished");
}
exports.findSlotsToRelease = findSlotsToRelease;
async function sendDateReminderNotifications() {
    const reminders = [
        {
            time: configurations_1.FIRST_DATE_REMINDER_TIME,
            reminderProp: "reminder1NotificationSent",
        },
        {
            time: configurations_1.SECOND_DATE_REMINDER_TIME,
            reminderProp: "reminder2NotificationSent",
        },
    ];
    for (const reminder of reminders) {
        const groups = await (0, data_conversion_1.fromQueryToGroupList)((0, queries_1.queryToGetGroupsToSendReminder)(reminder.time, reminder.reminderProp), false, true);
        for (const group of groups) {
            for (const user of group.members) {
                await (0, models_1.addNotificationToUser)({ userId: user.userId }, {
                    type: user_1.NotificationType.Group,
                    title: (0, i18n_tools_1.t)("Date reminder", { user }),
                    text: (0, i18n_tools_1.t)("Your group date will be in less than %s", { user }, moment.duration(reminder.time, "seconds").locale(user.language).humanize()),
                    targetId: group.groupId,
                }, { sendPushNotification: true, channelId: user_1.NotificationChannelId.DateReminders });
            }
        }
    }
}
exports.sendDateReminderNotifications = sendDateReminderNotifications;
function getComingWeekendDays(limitAmount) {
    const result = [];
    let i = 1;
    while (result.length < limitAmount) {
        const dayToCheck = moment().add(i, "day");
        const weekDay = dayToCheck.weekday();
        if (weekDay === 5 || weekDay === 6 || weekDay === 0) {
            result.push(dayToCheck.unix());
        }
        i++;
    }
    return result;
}
function generateGroupName(group) {
    var _a, _b;
    const membersNames = (_a = group.members) === null || _a === void 0 ? void 0 : _a.map(member => (0, string_tools_1.toFirstUpperCase)(member.name));
    return (_b = membersNames.join(", ")) !== null && _b !== void 0 ? _b : "";
}
function getSlotIdFromUsersAmount(amount) {
    return configurations_1.GROUP_SLOTS_CONFIGS.findIndex(slot => amount >= slot.minimumSize && amount <= slot.maximumSize);
}
exports.getSlotIdFromUsersAmount = getSlotIdFromUsersAmount;
//# sourceMappingURL=models.js.map