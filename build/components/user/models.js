"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onImageFileSaved = exports.onImageFileReceived = exports.sendWelcomeNotification = exports.createGenders = exports.attractionsSentGet = exports.attractionsReceivedGet = exports.matchesGet = exports.reportUserPost = exports.setAttractionPost = exports.notificationsGet = exports.addNotificationToUser = exports.retrieveFullyRegisteredUser = exports.userPost = exports.userGet = exports.userPropsAsQuestionsGet = exports.profileStatusGet = exports.createUser = exports.retrieveUser = exports.initializeUsers = void 0;
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
const models_2 = require("../admin/models");
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const push_notifications_2 = require("../../common-tools/push-notifications/push-notifications");
const getUserEmailFromAuthProvider_1 = require("./tools/authentication/getUserEmailFromAuthProvider");
const common_queries_1 = require("../../common-tools/database-tools/common-queries");
const koa_tools_1 = require("../../common-tools/koa-tools/koa-tools");
const general_1 = require("../../common-tools/math-tools/general");
const s3_tools_1 = require("../../common-tools/aws/s3-tools");
const process_tools_1 = require("../../common-tools/process/process-tools");
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
    const email = await (0, getUserEmailFromAuthProvider_1.getUserEmailFromAuthProvider)(token, ctx);
    user = await (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(email), includeFullInfo);
    if (user != null) {
        await (0, queries_1.queryToUpdateUserToken)(email, token);
        return { ...user, token };
    }
    return createUser(token, email, includeFullInfo, ctx);
}
exports.retrieveUser = retrieveUser;
async function createUser(token, email, includeFullInfo, ctx, setProfileCompletedForTesting, customUserIdForTesting) {
    let isAdmin = false;
    // The first user registered is set automatically to be admin, just double check that is the first user
    if ((0, models_2.getAmountOfUsersCount)() === 0) {
        await (0, models_2.updateAmountOfUsersCount)();
        if ((0, models_2.getAmountOfUsersCount)() === 0) {
            isAdmin = true;
        }
    }
    return (0, data_conversion_1.fromQueryToUser)((0, queries_1.queryToCreateUser)(token, email, setProfileCompletedForTesting, customUserIdForTesting, isAdmin), includeFullInfo);
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
        notShowedTagQuestions: (0, models_1.getNotShowedQuestionIds)(user),
        user,
    };
    const profileCompleted = result.missingEditableUserProps.length === 0 && result.notShowedTagQuestions.length === 0;
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
    return getMissingEditableUserProps(user).length === 0 && (0, models_1.getNotShowedQuestionIds)(user).length === 0;
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
function userPropsAsQuestionsGet(params, ctx) {
    // This just returns USER_PROPS_AS_QUESTIONS in the correct language:
    return configurations_1.USER_PROPS_AS_QUESTIONS.map(question => ({
        ...question,
        text: (0, i18n_tools_1.t)(question.text, { ctx }),
        shortVersion: (0, i18n_tools_1.t)(question.shortVersion, { ctx }),
        answers: question.answers.map(answer => ({
            ...answer,
            text: (0, i18n_tools_1.t)(answer.text, { ctx }),
        })),
    }));
}
exports.userPropsAsQuestionsGet = userPropsAsQuestionsGet;
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
 * This endpoint is used to send the user props.
 */
async function userPost(params, ctx) {
    let query = (0, queries_1.queryToGetUserByToken)(params.token);
    if (params.props != null) {
        const validationResult = (0, user_3.validateUserProps)(params.props);
        if (validationResult !== true) {
            ctx.throw(400, JSON.stringify(validationResult));
            return;
        }
        query = (0, queries_1.queryToSetUserProps)(query, params.props);
    }
    await (0, database_manager_1.sendQuery)(() => query.iterate());
    if (params.updateProfileCompletedProp) {
        const user = await retrieveUser(params.token, false, ctx);
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
async function addNotificationToUser(tokenOrId, notification, settings) {
    const user = await (0, data_conversion_1.fromQueryToUser)((0, queries_2.queryToGetUserByTokenOrId)(tokenOrId), false);
    if (settings === null || settings === void 0 ? void 0 : settings.translateNotification) {
        notification = {
            ...notification,
            title: (0, i18n_tools_1.t)(notification.title, { user }),
            text: (0, i18n_tools_1.t)(notification.text, { user }),
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
    await (0, queries_1.queryToUpdateUserProps)((0, queries_2.queryToGetUserByTokenOrId)(tokenOrId), [
        {
            key: "notifications",
            value: user.notifications,
        },
    ]);
    if ((settings === null || settings === void 0 ? void 0 : settings.sendPushNotification) && (0, push_notifications_1.isValidNotificationsToken)(user.notificationsToken)) {
        (0, push_notifications_2.sendPushNotifications)([
            {
                to: user.notificationsToken,
                title: notification.title,
                body: notification.text,
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
}
exports.addNotificationToUser = addNotificationToUser;
async function notificationsGet(params, ctx) {
    const traversal = (0, queries_1.queryToGetUserByToken)(params.token, null, true);
    return await (0, data_conversion_tools_1.fromQueryToSpecificPropValue)(traversal, "notifications");
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
    if (user == null) {
        return;
    }
    delete params.token;
    const objectToLog = {
        ...params,
        reportedBy: user.userId,
    };
    logToFile(JSON.stringify(objectToLog), "usersReported");
}
exports.reportUserPost = reportUserPost;
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
        title: (0, i18n_tools_1.t)("Welcome to Poly!", { ctx }),
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
    if ((0, process_tools_1.isProductionMode)() && process.env.USING_AWS === "true") {
        const fileNameBigInS3 = await (0, s3_tools_1.uploadFileToS3)({
            fileName: fullPathBig,
            targetPath: `images/${fileNameBig}`,
            allowPublicRead: true,
            contentType: "image/jpeg",
        });
        const fileNameSmallInS3 = await (0, s3_tools_1.uploadFileToS3)({
            fileName: fullPathSmall,
            targetPath: `images/${fileNameSmall}`,
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