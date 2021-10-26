"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommandPost = exports.adminNotificationSendPost = exports.onAdminFileSaved = exports.onAdminFileReceived = exports.visualizerPost = exports.loadCsvPost = exports.logGet = exports.logFileListGet = exports.logUsageReport = exports.getAmountOfUsersCount = exports.updateAmountOfUsersCount = exports.convertToAdmin = exports.convertToAdminPost = exports.allChatsWithAdminsGet = exports.adminChatPost = exports.adminChatGet = exports.validateCredentialsGet = exports.initializeAdmin = void 0;
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
const httpRequest_1 = require("../../common-tools/httpRequest/httpRequest");
const visualizer_proxy_tools_1 = require("../../common-tools/database-tools/visualizer-proxy-tools");
const koa_tools_1 = require("../../common-tools/koa-tools/koa-tools");
const files_tools_1 = require("../../common-tools/files-tools/files-tools");
const s3_tools_1 = require("../../common-tools/aws/s3-tools");
const data_conversion_2 = require("../user/tools/data-conversion");
const push_notifications_1 = require("../../common-tools/push-notifications/push-notifications");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const process_tools_1 = require("../../common-tools/process/process-tools");
/**
 * This initializer should be executed before the others because loadDatabaseFromDisk() restores
 * the last database backup if there is any and in order to restore the backup the database
 * should be empty, other initializers create content in the database that prevents this to be executed.
 */
async function initializeAdmin() {
    (0, files_tools_1.createFolder)("admin-uploads");
    await updateAmountOfUsersCount();
    (0, dynamic_1.setIntervalAsync)(logUsageReport, configurations_1.LOG_USAGE_REPORT_FREQUENCY);
    // To create a report when server boots and preview database:
    logUsageReport();
}
exports.initializeAdmin = initializeAdmin;
async function validateCredentialsGet(params, ctx) {
    return (0, validateAdminCredentials_1.validateAdminCredentials)(params);
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
let amountOfUsersCount = null;
async function updateAmountOfUsersCount() {
    amountOfUsersCount = (await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetAllUsers)().count().next())).value;
}
exports.updateAmountOfUsersCount = updateAmountOfUsersCount;
function getAmountOfUsersCount() {
    return amountOfUsersCount;
}
exports.getAmountOfUsersCount = getAmountOfUsersCount;
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
        amountOfUsers,
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
    const { user, password } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
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
    const { user, password, fileName } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
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
async function loadCsvPost(params, ctx) {
    var _a, _b, _c;
    const { user, password, fileName } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    if (((_a = process.env.AWS_BUCKET_NAME) !== null && _a !== void 0 ? _a : "").length < 2) {
        return "AWS_BUCKET_NAME is not set in the .env file";
    }
    if (((_b = process.env.AWS_CSV_IAM_ROLE_ARN) !== null && _b !== void 0 ? _b : "").length < 2) {
        return "AWS_CSV_IAM_ROLE_ARN is not set in the .env file";
    }
    if (((_c = process.env.AWS_REGION) !== null && _c !== void 0 ? _c : "").length < 2) {
        return "AWS_REGION is not set in the .env file";
    }
    const loaderEndpoint = process.env.DATABASE_URL.replace("gremlin", "loader").replace("wss:", "https:");
    const requestParams = {
        source: `s3://${process.env.AWS_BUCKET_NAME}/${fileName}`,
        format: "csv",
        iamRoleArn: process.env.AWS_CSV_IAM_ROLE_ARN,
        region: process.env.AWS_REGION,
        queueRequest: "TRUE",
    };
    const response = await (0, httpRequest_1.httpRequest)({ url: loaderEndpoint, method: "POST", params: requestParams });
    return { request: { url: loaderEndpoint, ...requestParams }, response };
}
exports.loadCsvPost = loadCsvPost;
async function visualizerPost(params, ctx) {
    const { user, password, query, nodeLimit } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
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
    const { user, password } = ctx.request.query;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
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
    const { user, password, channelId, onlyReturnUsersAmount, filters, notificationContent } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
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
    const { user, password, command } = params;
    const passwordValidation = (0, validateAdminCredentials_1.validateAdminCredentials)({ user, password });
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    return await (0, process_tools_1.executeSystemCommand)(command);
}
exports.runCommandPost = runCommandPost;
//# sourceMappingURL=models.js.map