"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailPost = exports.runCommandPost = exports.adminNotificationSendPost = exports.onAdminFileSaved = exports.onAdminFileReceived = exports.visualizerPost = exports.exportDatabaseGet = exports.importDatabasePost = exports.logGet = exports.logFileListGet = exports.logUsageReport = exports.convertToAdmin = exports.convertToAdminPost = exports.allChatsWithAdminsGet = exports.adminChatPost = exports.adminChatGet = exports.validateCredentialsGet = exports.initializeAdmin = void 0;
const moment = require("moment");
const fs = require("fs");
const dynamic_1 = require("set-interval-async/dynamic");
const perf_hooks_1 = require("perf_hooks");
const path = require("path");
const gremlin = require("gremlin");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const models_1 = require("../user/models");
const queries_1 = require("../user/queries");
const queries_2 = require("./queries");
const data_conversion_1 = require("./tools/data-conversion");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const queries_3 = require("../groups/queries");
const queries_4 = require("../groups-finder/queries");
const configurations_1 = require("../../configurations");
const types_1 = require("../groups-finder/tools/types");
const validateAdminCredentials_1 = require("./tools/validateAdminCredentials");
const visualizer_proxy_tools_1 = require("../../common-tools/database-tools/visualizer-proxy-tools");
const koa_tools_1 = require("../../common-tools/koa-tools/koa-tools");
const files_tools_1 = require("../../common-tools/files-tools/files-tools");
const s3_tools_1 = require("../../common-tools/aws/s3-tools");
const data_conversion_2 = require("../user/tools/data-conversion");
const push_notifications_1 = require("../../common-tools/push-notifications/push-notifications");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const process_tools_1 = require("../../common-tools/process/process-tools");
const neptune_tools_1 = require("../../common-tools/aws/neptune.tools");
const ses_tools_1 = require("../../common-tools/aws/ses-tools");
const tryToGetErrorMessage_1 = require("../../common-tools/httpRequest/tools/tryToGetErrorMessage");
const users_1 = require("../../tests/tools/users");
const models_2 = require("../email-login/models");
const models_3 = require("../groups/models");
/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
async function initializeAdmin() {
    (0, files_tools_1.createFolder)("admin-uploads");
    (0, dynamic_1.setIntervalAsync)(logUsageReport, configurations_1.LOG_USAGE_REPORT_FREQUENCY);
    // To create a report when server boots and preview database:
    logUsageReport();
    await createDemoAccounts();
}
exports.initializeAdmin = initializeAdmin;
async function validateCredentialsGet(params, ctx) {
    return await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
}
exports.validateCredentialsGet = validateCredentialsGet;
async function adminChatGet(params, ctx) {
    const callerUser = await (0, models_1.retrieveUser)(params.token, false, ctx);
    const nonAdminUserId = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
    const result = await (0, data_conversion_1.fromQueryToChatWithAdmins)((0, queries_2.queryToGetAdminChatMessages)(nonAdminUserId, callerUser.isAdmin));
    return result;
}
exports.adminChatGet = adminChatGet;
async function adminChatPost(params, ctx) {
    var _a;
    const callerUser = await (0, models_1.retrieveUser)(params.token, false, ctx);
    const nonAdminUserId = callerUser.isAdmin ? params.targetUserId : callerUser.userId;
    const currentChat = ((_a = (await (0, data_conversion_1.fromQueryToChatWithAdmins)((0, queries_2.queryToGetAdminChatMessages)(nonAdminUserId, false)))) === null || _a === void 0 ? void 0 : _a.messages) || [];
    currentChat.push({
        messageText: params.messageText,
        chatMessageId: (0, string_tools_1.generateId)(),
        time: moment().unix(),
        authorUserId: callerUser.isAdmin ? "" : callerUser.userId,
    });
    await (0, queries_2.queryToSaveAdminChatMessage)(nonAdminUserId, currentChat, callerUser.isAdmin || false).iterate();
    if (callerUser.isAdmin) {
        await (0, models_1.addNotificationToUser)({ userId: params.targetUserId }, {
            type: user_1.NotificationType.ContactChat,
            title: "You have a new message from an admin",
            text: "You can respond to the admin",
        }, { sendPushNotification: true, translateNotification: true });
    }
}
exports.adminChatPost = adminChatPost;
async function allChatsWithAdminsGet(params, ctx) {
    const callerUser = await (0, models_1.retrieveUser)(params.token, false, ctx);
    if (!callerUser.isAdmin) {
        return null;
    }
    return (0, data_conversion_1.fromQueryToChatWithAdminsList)((0, queries_2.queryToGetAllChatsWithAdmins)(params.excludeRespondedByAdmin));
}
exports.allChatsWithAdminsGet = allChatsWithAdminsGet;
async function convertToAdminPost(params, ctx) {
    const userRequesting = await (0, models_1.retrieveUser)(params.token, false, ctx);
    if (!userRequesting.isAdmin) {
        return;
    }
    const targetUser = await (0, models_1.retrieveUser)(params.targetUserToken, false, ctx);
    return convertToAdmin(targetUser.token);
}
exports.convertToAdminPost = convertToAdminPost;
async function convertToAdmin(token) {
    await (0, queries_1.queryToUpdateUserProps)(token, [{ key: "isAdmin", value: true }]);
}
exports.convertToAdmin = convertToAdmin;
async function logUsageReport() {
    const timeStart = perf_hooks_1.performance.now();
    const amountOfUsers = (await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetAllUsers)().count().next())).value;
    const amountOfFullyRegisteredUsers = (await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetAllCompleteUsers)().count().next()))
        .value;
    const incompleteUsers = amountOfUsers - amountOfFullyRegisteredUsers;
    const amountOfGroups = (await (0, database_manager_1.sendQuery)(() => (0, queries_3.queryToGetAllGroups)().count().next())).value;
    let totalOpenGroups = 0;
    const openGroupsBySlot = [];
    for (let i = 0; i < configurations_1.GROUP_SLOTS_CONFIGS.length; i++) {
        const amount = (await (0, queries_4.queryToGetGroupsReceivingMoreUsers)(i, types_1.GroupQuality.Good).toList()).length;
        openGroupsBySlot.push(amount);
        totalOpenGroups += amount;
    }
    const timeSpentOnReportMs = Math.round(perf_hooks_1.performance.now() - timeStart);
    const report = {
        amountOfUsers: amountOfFullyRegisteredUsers,
        incompleteUsers,
        amountOfGroups,
        totalOpenGroups,
        openGroupsBySlot,
        timeSpentOnReportMs,
    };
    logToFile(JSON.stringify(report), "usageReports");
}
exports.logUsageReport = logUsageReport;
async function logFileListGet(params, ctx) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return null;
    }
    let resolvePromise;
    const promise = new Promise(resolve => (resolvePromise = resolve));
    fs.readdir("./logs/", (err, files) => {
        resolvePromise(files.map(file => file));
    });
    return promise;
}
exports.logFileListGet = logFileListGet;
async function logGet(params, ctx) {
    const { fileName } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return null;
    }
    let resolvePromise;
    const promise = new Promise(resolve => (resolvePromise = resolve));
    fs.readFile("./logs/" + fileName, { encoding: "utf-8" }, function (err, data) {
        if (!err) {
            resolvePromise(data);
        }
        else {
            ctx.throw(err);
        }
    });
    return promise;
}
exports.logGet = logGet;
async function importDatabasePost(params, ctx) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
        return;
    }
    if (process.env.USING_AWS === "true") {
        return await (0, neptune_tools_1.importNeptuneDatabase)(params, ctx);
    }
}
exports.importDatabasePost = importDatabasePost;
async function exportDatabaseGet(params, ctx) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
        return;
    }
    if (process.env.USING_AWS === "true") {
        return await (0, neptune_tools_1.exportNeptuneDatabase)(ctx);
    }
}
exports.exportDatabaseGet = exportDatabaseGet;
async function visualizerPost(params, ctx) {
    const { query, nodeLimit } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    const client = new gremlin.driver.Client(database_manager_1.databaseUrl, {
        traversalSource: "g",
        mimeType: "application/json",
    });
    const result = await client.submit((0, visualizer_proxy_tools_1.makeQuery)(query, nodeLimit), {});
    return (0, visualizer_proxy_tools_1.nodesToJson)(result._items);
}
exports.visualizerPost = visualizerPost;
async function onAdminFileReceived(ctx, next) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(ctx.request.query);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
    }
    return (0, koa_tools_1.fileSaverForAdminFiles)(ctx, next);
}
exports.onAdminFileReceived = onAdminFileReceived;
async function onAdminFileSaved(files, ctx) {
    const fileNames = [];
    for (const fileKeyName of Object.keys(files)) {
        const file = files[fileKeyName];
        if (file == null || file.size === 0) {
            if (file) {
                fs.unlinkSync(file.path);
            }
            ctx.throw(400, "Invalid file provided", { ctx });
            return;
        }
        const folderPath = path.dirname(file.path);
        const fileName = path.basename(file.path);
        if (process.env.USING_AWS === "true") {
            const fileNameInS3 = await (0, s3_tools_1.uploadFileToS3)({
                fileName: folderPath + fileName,
                targetPath: fileName,
            });
            // Remove the file from the server because it's already on the S3
            await fs.promises.unlink(folderPath + fileName);
            fileNames.push(fileNameInS3);
        }
        else {
            fileNames.push(fileName);
        }
    }
    return { fileNames: fileNames };
}
exports.onAdminFileSaved = onAdminFileSaved;
async function adminNotificationSendPost(params, ctx) {
    const { channelId, onlyReturnUsersAmount, filters, notificationContent } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    const users = await (0, data_conversion_2.fromQueryToUserList)((0, queries_2.queryToSelectUsersForNotification)(filters), false, false);
    if (onlyReturnUsersAmount) {
        return `If you send the notification ${users.length} user(s) will receive it.`;
    }
    for (const user of users) {
        await (0, models_1.addNotificationToUser)({ token: user.token }, notificationContent, {
            translateNotification: false,
            sendPushNotification: false,
            channelId,
        });
    }
    const expoPushTickets = await (0, push_notifications_1.sendPushNotifications)(users.map(user => ({
        to: user.notificationsToken,
        title: notificationContent.title,
        body: notificationContent.text,
        data: {
            type: notificationContent.type,
            targetId: notificationContent.targetId,
            notificationId: (0, string_tools_1.generateId)(),
        },
        channelId: channelId ? channelId : user_1.NotificationChannelId.Default,
    })));
    // Some time to wait in order for expo to process the notification before the delivery status can be checked
    await (0, js_tools_1.time)(10000);
    const errors = await (0, push_notifications_1.getNotificationsDeliveryErrors)(expoPushTickets);
    let returnMessage = `Notification sent to ${users.length - errors.length} users.`;
    if (errors.length > 0) {
        returnMessage += ` ${errors.length} user(s) didn't receive the notification probably because uninstalled the app or disabled notifications, this is the delivery status report of those failed notifications:`;
        errors.forEach(error => (returnMessage += `\n${error}`));
    }
    return returnMessage;
}
exports.adminNotificationSendPost = adminNotificationSendPost;
// Runs a system command and return output
async function runCommandPost(params, ctx) {
    const { command } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    return await (0, process_tools_1.executeSystemCommand)(command);
}
exports.runCommandPost = runCommandPost;
async function sendEmailPost(params, ctx) {
    const { to, subject, text } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    try {
        return await (0, ses_tools_1.sendEmailUsingSES)({ to, subject, text });
    }
    catch (error) {
        return (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error);
    }
}
exports.sendEmailPost = sendEmailPost;
async function createDemoAccounts() {
    const usersCreated = [];
    // Create the users
    for (const demoProps of configurations_1.DEMO_ACCOUNTS) {
        const user = await (0, data_conversion_2.fromQueryToUser)((0, queries_1.queryToGetUserByEmail)(demoProps.email), false);
        if (user) {
            return;
        }
        const token = (0, models_2.createEmailLoginToken)({ email: demoProps.email, password: demoProps.password });
        const demoUser = await (0, users_1.createFakeUser)({
            ...demoProps,
            token,
            language: "es",
        });
        usersCreated.push(demoUser);
    }
    // They should like each other to not bug the group interface
    for (const user of usersCreated) {
        const otherUsers = usersCreated.filter(u => u.userId !== user.userId);
        await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToSetAttraction)({
            token: user.token,
            attractions: otherUsers.map(userToConnect => ({
                userId: userToConnect.userId,
                attractionType: user_1.AttractionType.Like,
            })),
        }).iterate());
    }
    // Put them in a demo group
    await (0, models_3.createGroup)({
        usersIds: usersCreated.map(u => u.userId),
        slotToUse: (0, models_3.getSlotIdFromUsersAmount)(usersCreated.length),
    }, null, true);
    /*
     * Set the demoAccount property to true for the users. This should be the last thing executed because setting
     * this disables some functionality that we are using on the lines above.
     */
    for (const demoProps of configurations_1.DEMO_ACCOUNTS) {
        await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserByEmail)(demoProps.email).property("demoAccount", true).iterate());
    }
}
//# sourceMappingURL=models.js.map