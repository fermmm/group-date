"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onImageFileSaved = exports.onImageFileReceived = exports.sendWelcomeNotification = exports.createGenders = exports.deleteAccountPost = exports.taskCompletedPost = exports.createRequiredTaskForUser = exports.setSeenPost = exports.attractionsSentGet = exports.attractionsReceivedGet = exports.matchesGet = exports.unblockUserPost = exports.blockUserPost = exports.reportUserPost = exports.setAttractionPost = exports.notificationsGet = exports.sendEmailNotification = exports.addNotificationToUser = exports.retrieveFullyRegisteredUser = exports.questionsGet = exports.userPost = exports.userGet = exports.profileStatusGet = exports.createUser = exports.retrieveUser = exports.initializeUsers = void 0;
const user_1 = require("./../../shared-tools/endpoints-interfaces/user");
const push_notifications_1 = require("./../../common-tools/push-notifications/push-notifications");
const security_tools_1 = require("./../../common-tools/security-tools/security-tools");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const sharp = require("sharp");
const files_tools_1 = require("../../common-tools/files-tools/files-tools");
const user_2 = require("../../shared-tools/endpoints-interfaces/user");
const user_3 = require("../../shared-tools/validators/user");
const queries_1 = require("./queries");
const data_conversion_1 = require("./tools/data-conversion");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const queries_2 = require("./queries");
const models_1 = require("../tags/models");
const configurations_1 = require("../../configurations");
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const push_notifications_2 = require("../../common-tools/push-notifications/push-notifications");
const getUserEmailFromAuthProvider_1 = require("./tools/authentication/getUserEmailFromAuthProvider");
const common_queries_1 = require("../../common-tools/database-tools/common-queries");
const koa_tools_1 = require("../../common-tools/koa-tools/koa-tools");
const general_1 = require("../../common-tools/math-tools/general");
const s3_tools_1 = require("../../common-tools/aws/s3-tools");
const process_tools_1 = require("../../common-tools/process/process-tools");
const email_tools_1 = require("../../common-tools/email-tools/email-tools");
const loadHtmlTemplate_1 = require("../../common-tools/email-tools/loadHtmlTemplate");
const log_1 = require("../../common-tools/log-tool/log");
const types_1 = require("../../common-tools/log-tool/types");
const questions_1 = require("./tools/questions");
async function initializeUsers() {
    (0, files_tools_1.createFolder)("uploads");
    createGenders();
}
exports.initializeUsers = initializeUsers;
/**
 * Tries to get the user using the Facebook token and if the user does not exist it creates it.
 * It does the following in order:
 *
 * 1. If the database finds the user with the provided token returns the user and that's all
 * 2. If the token does not exist in database then sends the token to Facebook to try to get the user email
 * 3. If Facebook does not return the email of the user it means the token is invalid: throws error (ctx.throw)
 * 4. If using the email the database finds a user then replaces token cached and returns the user
 * 5. If not, it means we are dealing with a new user, so it creates it with the email and token and returns it
 *
 * @param token Token from the Facebook login in the client application
 * @param includeFullInfo Includes tags data
 */
async function retrieveUser(token, includeFullInfo, ctx) {
    let user = null;
    user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(token), includeFullInfo);
    if (user != null) {
        return user;
    }
    // This function throws ctx error if the email cannot be retrieved
    const email = await (0, getUserEmailFromAuthProvider_1.getUserEmailFromToken)(token, ctx);
    user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), includeFullInfo);
    if (user != null) {
        await (0, queries_1.queryToUpdateUserToken)((0, queries_1.queryToGetUserByEmail)(email), token);
        return { ...user, token };
    }
    return createUser({ token, email, includeFullInfo, ctx });
}
exports.retrieveUser = retrieveUser;
async function createUser(props) {
    return (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToCreateUser)(props), props.includeFullInfo);
}
exports.createUser = createUser;
/**
 * This endpoint returns all user props that are missing, only when this endpoint returns empty arrays
 * the user can proceed with the endpoints not related with registration.
 * If the user does not exist this endpoint creates it and it should be used also for the user creation.
 * Also the language is set on this endpoint, example: "Accept-Language: es" on the header of the request.
 */
async function profileStatusGet(params, ctx) {
    const user = await retrieveUser(params.token, true, ctx);
    const result = {
        missingEditableUserProps: getMissingEditableUserProps(user),
        notRespondedQuestions: (0, models_1.getNotRespondedQuestionIds)(user),
        user,
    };
    const profileCompleted = result.missingEditableUserProps.length === 0 && result.notRespondedQuestions.length === 0;
    const lastLoginDate = moment().unix();
    const language = (0, i18n_tools_1.getLocaleFromHeader)(ctx);
    await (0, queries_1.queryToUpdateUserProps)(user.token, [
        {
            key: "profileCompleted",
            value: profileCompleted,
        },
        {
            key: "lastLoginDate",
            value: lastLoginDate,
        },
        {
            key: "language",
            value: language,
        },
    ]);
    /**
     * When this if executes it means the user just finished with all registration steps
     * Also this can happen inside the userPost function
     */
    if (!user.profileCompleted && profileCompleted) {
        sendWelcomeNotification(user, ctx);
    }
    // The returned user object should be up to date:
    result.user.profileCompleted = profileCompleted;
    result.user.lastLoginDate = lastLoginDate;
    result.user.language = language;
    return result;
}
exports.profileStatusGet = profileStatusGet;
function profileStatusIsCompleted(user) {
    return getMissingEditableUserProps(user).length === 0 && (0, models_1.getNotRespondedQuestionIds)(user).length === 0;
}
function getMissingEditableUserProps(user) {
    const result = [];
    user_3.requiredUserPropsList.forEach(editableUserProp => {
        const propValue = user[editableUserProp];
        if (propValue == null) {
            result.push(editableUserProp);
        }
    });
    return result;
}
/**
 * This endpoint retrieves a user. If userId is not provided it will return the user using the token.
 * If userId is provided it will return the required user (without personal information) but also it will
 * check the token for security reasons.
 */
async function userGet(params, ctx) {
    const userFromToken = await retrieveUser(params.token, true, ctx);
    if (params.userId == null) {
        return userFromToken;
    }
    else {
        if (userFromToken != null) {
            return (0, security_tools_1.removePrivacySensitiveUserProps)(await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserById)(params.userId), true));
        }
    }
}
exports.userGet = userGet;
/**
 * This endpoint is used to change the user props.
 */
async function userPost(params, ctx) {
    const { token, props = {}, questionAnswers, updateProfileCompletedProp } = params;
    let userPropsToSet = { ...props }; // We need to copy the object here to not brake tests.
    // Check the prop keys received in the request are all editable user prop keys, otherwise delete the prop (ths logic is testing friendly).
    for (const key of Object.keys(userPropsToSet)) {
        if (!user_3.editableUserPropListAsSet.has(key)) {
            delete userPropsToSet[key];
        }
    }
    // We may not need to retrieve the user so we initially set it as null
    let user = null;
    if (questionAnswers && questionAnswers.length > 0) {
        user = await retrieveUser(token, false, ctx);
        const questionRelatedProps = await (0, questions_1.applyQuestionResponses)({
            token,
            answers: questionAnswers,
            questionsResponded: user.questionsResponded,
        });
        userPropsToSet = { ...userPropsToSet, ...questionRelatedProps };
    }
    let traversal = (0, queries_1.queryToGetUserByToken)(token);
    if (Object.keys(userPropsToSet).length > 0) {
        // Make sure user props content is valid
        const validationResult = (0, user_3.validateUserProps)(userPropsToSet);
        if (validationResult !== true) {
            ctx.throw(400, JSON.stringify(validationResult));
            return;
        }
        traversal = (0, queries_1.queryToSetUserProps)(traversal, userPropsToSet);
    }
    await (0, database_manager_1.sendQuery)(() => traversal.iterate());
    if (updateProfileCompletedProp) {
        if (user == null) {
            user = await retrieveUser(token, false, ctx);
        }
        const profileCompleted = profileStatusIsCompleted(user);
        await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserByToken)(params.token)
            .property(database_manager_1.cardinality.single, "profileCompleted", profileCompleted)
            .iterate());
        /**
         * When this if executes it means the user just finished with all registration steps
         * Also this can happen inside the profileStatusGet function
         */
        if (!user.profileCompleted && profileCompleted) {
            sendWelcomeNotification(user, ctx);
        }
    }
}
exports.userPost = userPost;
function questionsGet(params, ctx) {
    // This just sends QUESTIONS_FOR_CLIENT but translates it first
    return questions_1.QUESTIONS_FOR_CLIENT.map(q => ({
        ...q,
        text: (0, i18n_tools_1.t)(q.text, { ctx }),
        extraText: q.extraText != null ? (0, i18n_tools_1.t)(q.extraText, { ctx }) : null,
        answers: q.answers.map(a => ({
            ...a,
            text: (0, i18n_tools_1.t)(a.text, { ctx }),
            extraText: a.extraText != null ? (0, i18n_tools_1.t)(a.extraText, { ctx }) : null,
        })),
    }));
}
exports.questionsGet = questionsGet;
/**
 * Calls retrieveUser and returns the same thing, but if profileCompleted is not true throws error
 *
 * @param token Token from the Facebook login in the client application
 * @param ctx
 */
async function retrieveFullyRegisteredUser(token, includeFullInfo, ctx) {
    const user = await retrieveUser(token, includeFullInfo, ctx);
    if (!user.profileCompleted) {
        ctx.throw(400, (0, i18n_tools_1.t)("Incomplete profiles not allowed in this endpoint", { ctx }));
        return;
    }
    return user;
}
exports.retrieveFullyRegisteredUser = retrieveFullyRegisteredUser;
/**
 * Internal function to add a notification to the user object and optionally send push notification.
 */
async function addNotificationToUser(tokenIdOrUser, notification, settings) {
    var _a;
    let user;
    if (tokenIdOrUser["user"]) {
        user = tokenIdOrUser["user"];
    }
    else {
        user = await (0, data_conversion_1.fromQueryToUser)((0, queries_2.queryToGetUserByTokenOrId)(tokenIdOrUser), false);
    }
    if (settings === null || settings === void 0 ? void 0 : settings.translateNotification) {
        notification = {
            ...notification,
            title: (0, i18n_tools_1.t)(notification.title, { user }),
            text: (0, i18n_tools_1.t)(notification.text, { user }),
        };
    }
    else if (settings === null || settings === void 0 ? void 0 : settings.translateTitleOnly) {
        notification = {
            ...notification,
            title: (0, i18n_tools_1.t)(notification.title, { user }),
        };
    }
    if (notification.idForReplacement != null) {
        const previousNotificationIndex = user.notifications.findIndex(n => n.idForReplacement === notification.idForReplacement);
        if (previousNotificationIndex > -1) {
            user.notifications.splice(previousNotificationIndex, 1);
        }
    }
    const finalNotification = {
        ...notification,
        notificationId: (0, string_tools_1.generateId)(),
        date: moment().unix(),
    };
    user.notifications.push(finalNotification);
    await (0, queries_1.queryToUpdateUserProps)((0, queries_2.queryToGetUserByTokenOrId)({ userId: user.userId }), [
        {
            key: "notifications",
            value: user.notifications,
        },
    ]);
    // Don't send push notifications on test environment
    if (!(0, process_tools_1.isProductionMode)() && !configurations_1.ENABLE_PUSH_AND_EMAIL_NOTIFICATIONS_ON_DEBUG_MODE) {
        return;
    }
    if ((settings === null || settings === void 0 ? void 0 : settings.sendPushNotification) && (0, push_notifications_1.isValidNotificationsToken)(user.notificationsToken)) {
        (0, push_notifications_2.sendPushNotifications)([
            {
                to: user.notificationsToken,
                title: notification.title,
                body: notification.text,
                priority: "high",
                sound: "default",
                data: {
                    type: notification.type,
                    targetId: notification.targetId,
                    notificationId: finalNotification.notificationId,
                },
                channelId: settings.channelId ? settings.channelId : user_2.NotificationChannelId.Default,
            },
        ]).then(expoPushTickets => {
            if (configurations_1.LOG_PUSH_NOTIFICATION_DELIVERING_RESULT) {
                // After an hour we log if the notifications were delivered without any error:
                setTimeout(async () => {
                    const errors = await (0, push_notifications_1.getNotificationsDeliveryErrors)(expoPushTickets);
                    if (errors.length > 0) {
                        errors.forEach(error => console.log(error));
                    }
                }, (0, general_1.hoursToMilliseconds)(1));
            }
        });
    }
    if (settings === null || settings === void 0 ? void 0 : settings.sendEmailNotification) {
        sendEmailNotification({
            user,
            notification: {
                ...notification,
                text: notification.text + " " + ((_a = settings === null || settings === void 0 ? void 0 : settings.emailTextExtraContent) !== null && _a !== void 0 ? _a : ""),
            },
        });
    }
}
exports.addNotificationToUser = addNotificationToUser;
async function sendEmailNotification(props) {
    const { user, notification } = props;
    return await (0, email_tools_1.sendEmail)({
        to: user.email,
        senderName: `${configurations_1.APPLICATION_NAME} app`,
        subject: notification.title,
        html: (0, loadHtmlTemplate_1.loadHtmlEmailTemplate)({
            variablesToReplace: {
                title: notification.title,
                content: notification.text,
            },
            translationSources: { user },
        }),
    });
}
exports.sendEmailNotification = sendEmailNotification;
async function notificationsGet(params, ctx) {
    const traversal = (0, queries_1.queryToGetUserByToken)(params.token, null, true);
    return await (0, data_conversion_tools_1.fromQueryToSpecificPropValue)(traversal, "notifications", {
        needsDecoding: user_3.USER_PROPS_TO_ENCODE.has("notifications"),
        needsParsing: user_3.USER_PROPS_TO_STRINGIFY.includes("notifications"),
    });
}
exports.notificationsGet = notificationsGet;
/**
 * Endpoint to set attraction (like or dislike a user)
 */
async function setAttractionPost(params, ctx) {
    const attractions = params.attractions;
    const limit = 200;
    if (attractions.length > limit) {
        ctx.throw(400, `More than ${limit} attractions are not allowed on the same request`);
        return;
    }
    await (0, js_tools_1.divideArrayCallback)(attractions, 50, async (attractionsChunk) => {
        await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToSetAttraction)({ token: params.token, attractions: attractionsChunk }).iterate());
    });
}
exports.setAttractionPost = setAttractionPost;
async function reportUserPost(params, ctx) {
    const user = await retrieveUser(params.token, false, ctx);
    delete params.token;
    if (user == null) {
        return;
    }
    const reportedUser = await (0, data_conversion_1.fromQueryToUser)((0, queries_2.queryToGetUserByTokenOrId)({ userId: params.reportedUserId }), false);
    if (reportedUser.demoAccount) {
        ctx.throw(400, "Demo accounts can't be reported");
        return;
    }
    const objectToLog = {
        ...params,
        reportedBy: user.userId,
    };
    (0, log_1.log)(objectToLog, types_1.LogId.UsersReported);
}
exports.reportUserPost = reportUserPost;
async function blockUserPost(params, ctx) {
    const user = await retrieveUser(params.token, false, ctx);
    if (user == null) {
        return { success: false };
    }
    const targetUser = await (0, data_conversion_1.fromQueryToUser)((0, queries_2.queryToGetUserByTokenOrId)({ userId: params.targetUserId }), false);
    if (targetUser == null) {
        return { success: false };
    }
    if (targetUser.demoAccount || user.demoAccount) {
        ctx.throw(400, "Demo accounts cannot block users or be blocked");
        return;
    }
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToBlockUser)({ requesterUserId: user.userId, targetUserId: targetUser.userId }).iterate());
    return { success: true };
}
exports.blockUserPost = blockUserPost;
async function unblockUserPost(params, ctx) {
    const user = await retrieveUser(params.token, false, ctx);
    if (user == null) {
        return { success: false };
    }
    const targetUser = await (0, data_conversion_1.fromQueryToUser)((0, queries_2.queryToGetUserByTokenOrId)({ userId: params.targetUserId }), false);
    if (targetUser == null) {
        return { success: false };
    }
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToUnblockUser)({ requesterUserId: user.userId, targetUserId: targetUser.userId }).iterate());
    return { success: true };
}
exports.unblockUserPost = unblockUserPost;
/**
 * This function is not exposed to the server API. It's only for tests.
 */
async function matchesGet(token) {
    return (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetMatches)(token), false, false);
}
exports.matchesGet = matchesGet;
/**
 * This function is not exposed to the server API. It's only for tests.
 */
async function attractionsReceivedGet(token, types) {
    return (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetAttractionsReceived)(token, types), false, false);
}
exports.attractionsReceivedGet = attractionsReceivedGet;
/**
 * This function is not exposed to the server API. It's only for tests.
 */
async function attractionsSentGet(token, types) {
    return (0, data_conversion_1.fromQueryToUserList)((0, queries_1.queryToGetAttractionsSent)(token, types), false, false);
}
exports.attractionsSentGet = attractionsSentGet;
/**
 * This endpoint is called when a user requests a SeenMatch to become a Match, so they can be in a
 * group together again. This is useful when the group didn't meet because not enough users wanted
 * to meet but those who wanted to meet can request to be in a group together again.
 * To make the change is required that both users request the change. So the first user requesting
 * is only saved and no change is made.
 */
async function setSeenPost(params, ctx) {
    const { token, setSeenActions } = params;
    const user = await retrieveUser(token, false, ctx);
    if (user == null) {
        return;
    }
    // This can be optimized by sending the array to the query but this endpoint is not executed very often
    for (const seenAction of setSeenActions) {
        // Other actions are not implemented yet, (like set as seen again)
        if (seenAction.action === user_1.SetSeenAction.RequestRemoveSeen) {
            await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToRemoveSeen)({
                requesterUserId: user.userId,
                targetUserId: seenAction.targetUserId,
            }).iterate());
        }
    }
    return { success: true };
}
exports.setSeenPost = setSeenPost;
/**
 * This function is not an endpoint. Is called internally to add a required task to a user.
 * Required tasks is an array in the user props that contains information about the tasks that the user
 * has to complete at login.
 */
async function createRequiredTaskForUser(params) {
    var _a, _b;
    const { userId, task, notification, translateNotification, avoidDuplication = true } = params;
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserById)(userId), false);
    if (user == null) {
        return;
    }
    if (avoidDuplication) {
        const existingTask = (_a = user.requiredTasks) === null || _a === void 0 ? void 0 : _a.find(requiredTask => requiredTask.type === task.type && requiredTask.taskInfo === task.taskInfo);
        if (existingTask) {
            return;
        }
    }
    const newRequiredTasks = [...((_b = user.requiredTasks) !== null && _b !== void 0 ? _b : []), { ...task, taskId: (0, string_tools_1.generateId)() }];
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserById)(userId)
        .property(database_manager_1.cardinality.single, "requiredTasks", JSON.stringify(newRequiredTasks))
        .iterate());
    if (notification) {
        await addNotificationToUser({ userId }, notification, {
            sendPushNotification: true,
            translateNotification,
        });
    }
}
exports.createRequiredTaskForUser = createRequiredTaskForUser;
/**
 * This endpoint is called to notify that the user completed a required task. Removes the task by taskId.
 * Required tasks is an array in the user props that contains information about the tasks that the user
 * has to complete at login.
 */
async function taskCompletedPost(params, ctx) {
    const { token, taskId } = params;
    const user = await retrieveUser(token, false, ctx);
    if (user == null) {
        return;
    }
    const newRequiredTasks = user.requiredTasks.filter(task => task.taskId !== taskId);
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserByToken)(params.token)
        .property(database_manager_1.cardinality.single, "requiredTasks", JSON.stringify(newRequiredTasks))
        .iterate());
    return { success: true };
}
exports.taskCompletedPost = taskCompletedPost;
async function deleteAccountPost(params, ctx) {
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(params.token), false);
    if (user == null) {
        return;
    }
    if (user.demoAccount) {
        ctx.throw(400, "Demo accounts cannot be deleted");
        return;
    }
    await (0, database_manager_1.sendQuery)(() => (0, queries_2.queryToGetUserByTokenOrId)({ token: params.token }).drop().iterate());
    const userAfterDeletion = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByToken)(params.token), false);
    return { success: userAfterDeletion == null };
}
exports.deleteAccountPost = deleteAccountPost;
async function createGenders() {
    await (0, database_manager_1.sendQuery)(() => (0, common_queries_1.queryToCreateVerticesFromObjects)({
        objects: user_1.ALL_GENDERS.map(gender => ({ genderId: gender })),
        label: "gender",
        duplicationAvoidanceProperty: "genderId",
    }).iterate());
}
exports.createGenders = createGenders;
async function sendWelcomeNotification(user, ctx) {
    var _a;
    if (((_a = user === null || user === void 0 ? void 0 : user.notifications) === null || _a === void 0 ? void 0 : _a.find(n => n.idForReplacement === "welcome")) != null) {
        return;
    }
    const notificationContent = {
        title: (0, i18n_tools_1.t)("Welcome to GroupDate!", { ctx }),
        text: (0, i18n_tools_1.t)("Press this notification if you are someone curious", { ctx }),
        type: user_2.NotificationType.About,
        notificationId: (0, string_tools_1.generateId)(),
        date: moment().unix(),
        idForReplacement: "welcome",
    };
    await addNotificationToUser({ userId: user.userId }, notificationContent, {
        sendPushNotification: true,
        channelId: user_2.NotificationChannelId.Default,
        translateNotification: false,
    });
}
exports.sendWelcomeNotification = sendWelcomeNotification;
async function onImageFileReceived(ctx, next) {
    // Only valid users can upload images
    const user = await retrieveUser(ctx.request.query.token, false, ctx);
    if (user == null) {
        return;
    }
    return (0, koa_tools_1.fileSaverForImages)(ctx, next);
}
exports.onImageFileReceived = onImageFileReceived;
async function onImageFileSaved(file, ctx) {
    if (file == null || file.size === 0) {
        if (file) {
            fs.promises.unlink(file.path);
        }
        ctx.throw(400, (0, i18n_tools_1.t)("Invalid file provided", { ctx }));
        return;
    }
    const originalFileExtension = path.extname(file.name).toLowerCase();
    const folderPath = path.dirname(file.path);
    const fileName = path.basename(file.path).replace(originalFileExtension, "");
    const fileNameSmall = `${fileName}_small.jpg`;
    const fileNameBig = `${fileName}_big.jpg`;
    const fullPathBig = `${folderPath}/${fileNameBig}`;
    const fullPathSmall = `${folderPath}/${fileNameSmall}`;
    /**
     * Throw error and remove files with invalid extension or format
     */
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
        fs.promises.unlink(file.path);
        ctx.throw(400, (0, i18n_tools_1.t)("File format not supported", { ctx }));
        return;
    }
    if (originalFileExtension !== ".jpg" &&
        originalFileExtension !== ".jpeg" &&
        originalFileExtension !== ".png") {
        fs.promises.unlink(file.path);
        ctx.throw(400, (0, i18n_tools_1.t)("Attempted to upload a file with wrong extension", { ctx }));
        return;
    }
    /**
     * Resize image to an optimal format.
     * "sharp.fit.outside" setting resizes the image preserving aspect ratio until width or height
     * is equal the the numbers provided.
     */
    await sharp(file.path)
        .resize(configurations_1.BIG_IMAGE_SIZE, configurations_1.BIG_IMAGE_SIZE, { fit: sharp.fit.outside })
        .jpeg()
        .toFile(fullPathBig);
    /**
     * Resize a copy of the image to create a small version to use as profile picture
     * "sharp.fit.outside" setting resizes the image preserving aspect ratio until width or height
     * is equal the the numbers provided.
     */
    await sharp(file.path)
        .resize(configurations_1.SMALL_IMAGE_SIZE, configurations_1.SMALL_IMAGE_SIZE, { fit: sharp.fit.outside })
        .jpeg()
        .toFile(fullPathSmall);
    // Remove the original image file to save disk space:
    fs.promises.unlink(file.path);
    // If using AWS upload to S3
    if ((0, process_tools_1.isRunningOnAws)()) {
        const fileNameBigInS3 = await (0, s3_tools_1.uploadFileToS3)({
            localFilePath: fullPathBig,
            s3TargetPath: `image-uploads/${fileNameBig}`,
            allowPublicRead: true,
            contentType: "image/jpeg",
        });
        const fileNameSmallInS3 = await (0, s3_tools_1.uploadFileToS3)({
            localFilePath: fullPathSmall,
            s3TargetPath: `image-uploads/${fileNameSmall}`,
            allowPublicRead: true,
            contentType: "image/jpeg",
        });
        fs.promises.unlink(fullPathSmall);
        fs.promises.unlink(fullPathBig);
    }
    return { fileNameSmall, fileNameBig };
}
exports.onImageFileSaved = onImageFileSaved;
//# sourceMappingURL=models.js.map