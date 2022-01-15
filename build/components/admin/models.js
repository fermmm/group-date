"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailPost = exports.removeAllBanReasonsFromUser = exports.removeBanFromUserPost = exports.banUserPost = exports.runCommandPost = exports.adminNotificationSendPost = exports.onAdminFileSaved = exports.onAdminFileReceived = exports.deleteDbPost = exports.visualizerPost = exports.exportDatabaseGet = exports.importDatabasePost = exports.logGet = exports.logFileListGet = exports.logUsageReport = exports.convertToAdmin = exports.convertToAdminPost = exports.allChatsWithAdminsGet = exports.adminChatPost = exports.adminChatGet = exports.validateCredentialsGet = exports.initializeAdmin = void 0;
const moment = require("moment");
const fs = require("fs");
const dynamic_1 = require("set-interval-async/dynamic");
const appRoot = require("app-root-path");
const perf_hooks_1 = require("perf_hooks");
const path = require("path");
const admin_1 = require("../../shared-tools/endpoints-interfaces/admin");
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
const files_tools_1 = require("../../common-tools/files-tools/files-tools");
const s3_tools_1 = require("../../common-tools/aws/s3-tools");
const data_conversion_2 = require("../user/tools/data-conversion");
const push_notifications_1 = require("../../common-tools/push-notifications/push-notifications");
const js_tools_1 = require("../../common-tools/js-tools/js-tools");
const process_tools_1 = require("../../common-tools/process/process-tools");
const neptune_tools_1 = require("../../common-tools/aws/neptune-tools");
const ses_tools_1 = require("../../common-tools/aws/ses-tools");
const tryToGetErrorMessage_1 = require("../../common-tools/httpRequest/tools/tryToGetErrorMessage");
const users_1 = require("../../tests/tools/users");
const models_2 = require("../email-login/models");
const models_3 = require("../groups/models");
const koaBody = require("koa-body");
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
            ctx.throw(400, err);
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
    let responses = "";
    if (params.format === admin_1.DatabaseContentFileFormat.NeptuneCsv) {
        if ((0, process_tools_1.isRunningOnAws)()) {
            responses += JSON.stringify(await (0, neptune_tools_1.importDatabaseContentCsvToNeptune)(params, ctx));
            // deleteFilesFromS3(params.filePaths); // This seems to prevent loader to work, it uses the files in the S3 for some time and cannot be removed.
        }
        else {
            ctx.throw(400, "Error: Importing Neptune CSV files only works when running on AWS (in production mode) and when USING_AWS = true");
        }
    }
    if (params.format === admin_1.DatabaseContentFileFormat.GremlinQuery) {
        for (const filePath of params.filePaths) {
            let fileContent;
            if ((0, process_tools_1.isRunningOnAws)()) {
                fileContent = await (0, s3_tools_1.readFileContentFromS3)(filePath);
                // deleteFilesFromS3(params.filePaths); // This seems to prevent loader to work, it uses the files in the S3 for some time and cannot be removed.
            }
            else {
                fileContent = (0, files_tools_1.getFileContent)(filePath);
            }
            responses += await (0, database_manager_1.importDatabaseContentFromQueryFile)({ fileContent, fileNameForLogs: filePath });
        }
    }
    if (params.format === admin_1.DatabaseContentFileFormat.GraphMl) {
        if (params.filePaths.length > 1) {
            ctx.throw(400, "Error: GraphML file format is only 1 file for the whole database. Multiple files were selected.");
        }
        const filePath = params.filePaths[0];
        if ((0, process_tools_1.isRunningOnAws)()) {
            try {
                responses += await (0, neptune_tools_1.importDatabaseContentXmlToNeptune)(filePath, ctx);
            }
            catch (e) {
                responses += (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e);
            }
            (0, s3_tools_1.deleteFilesFromS3)(params.filePaths);
        }
        else {
            responses += await (0, database_manager_1.importDatabaseContentFromFile)(filePath);
        }
    }
    for (const filePath of params.filePaths) {
        (0, files_tools_1.deleteFile)(filePath);
    }
    return responses;
}
exports.importDatabasePost = importDatabasePost;
async function exportDatabaseGet(params, ctx) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
        return;
    }
    if ((0, process_tools_1.isRunningOnAws)()) {
        return await (0, neptune_tools_1.exportDatabaseContentFromNeptune)(ctx);
    }
    else {
        await (0, database_manager_1.exportDatabaseContentToFile)("admin-uploads/temp/db-export/db-exported.xml");
        await (0, files_tools_1.createZipFileFromDirectory)("admin-uploads/temp/db-export", "admin-uploads/db-export/db-exported.zip");
        (0, files_tools_1.deleteFolder)("admin-uploads/temp");
        return {
            commandResponse: "Done",
            folder: `api/admin-uploads/db-export/db-exported.zip?hash=${(0, validateAdminCredentials_1.getCredentialsHash)()}`,
        };
    }
}
exports.exportDatabaseGet = exportDatabaseGet;
async function visualizerPost(params, ctx) {
    const { query, nodeLimit } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    const result = await (0, database_manager_1.sendQueryAsString)((0, visualizer_proxy_tools_1.makeQueryForVisualizer)(query, nodeLimit));
    return (0, visualizer_proxy_tools_1.nodesToJson)(result._items);
}
exports.visualizerPost = visualizerPost;
async function deleteDbPost(params, ctx) {
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        return passwordValidation.error;
    }
    await (0, database_manager_1.removeAllDatabaseContent)();
}
exports.deleteDbPost = deleteDbPost;
async function onAdminFileReceived(ctx, next) {
    var _a, _b;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(ctx.request.query);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
    }
    // In the following code it's configured how the file is saved.
    const uploadDirRelative = `/admin-uploads/${(_b = (_a = ctx.request.query) === null || _a === void 0 ? void 0 : _a.folder) !== null && _b !== void 0 ? _b : ""}`;
    const uploadDir = path.join(appRoot.path, uploadDirRelative);
    (0, files_tools_1.createFolder)(uploadDirRelative);
    return koaBody({
        multipart: true,
        formidable: {
            uploadDir,
            onFileBegin: (name, file) => {
                file.path = `${uploadDir}/${file.name}`;
            },
            keepExtensions: true,
        },
        onError: (error, ctx) => {
            ctx.throw(400, error);
        },
    })(ctx, next);
}
exports.onAdminFileReceived = onAdminFileReceived;
async function onAdminFileSaved(files, ctx) {
    const filePaths = [];
    for (const fileKeyName of Object.keys(files)) {
        const file = files[fileKeyName];
        if (file == null || file.size === 0) {
            if (file) {
                fs.unlinkSync(file.path);
            }
            ctx.throw(400, "Invalid file provided", { ctx });
            return;
        }
        const absoluteFolderPath = path.dirname(file.path);
        const folderPath = path.relative(appRoot.path, absoluteFolderPath) + "/";
        const fileName = path.basename(file.path);
        if (process.env.USING_AWS === "true" && (0, process_tools_1.isProductionMode)()) {
            const fileNameInS3 = await (0, s3_tools_1.uploadFileToS3)({
                localFilePath: file.path,
                s3TargetPath: folderPath + fileName,
            });
            // Remove the file from the server because it's already on the S3
            await fs.promises.unlink(file.path);
            filePaths.push(fileNameInS3);
        }
        else {
            filePaths.push(folderPath + fileName);
        }
    }
    return { filePaths };
}
exports.onAdminFileSaved = onAdminFileSaved;
async function adminNotificationSendPost(params, ctx) {
    const { channelId, onlyReturnUsersAmount, filters, notificationContent, sendEmailNotification } = params;
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
            sendEmailNotification,
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
async function banUserPost(params, ctx) {
    var _a;
    const { userId, reason } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(passwordValidation.error);
        return;
    }
    const user = await (0, data_conversion_2.fromQueryToUser)((0, queries_1.queryToGetUserById)(userId), false);
    if (!user) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(404, "User not found");
        return;
    }
    if ((_a = user.banReasons) === null || _a === void 0 ? void 0 : _a.includes(reason)) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(400, "User already banned for this reason");
        return;
    }
    await (0, database_manager_1.sendQuery)(() => {
        var _a;
        return (0, queries_1.queryToGetUserById)(userId)
            .property("banReasons", JSON.stringify([...((_a = user.banReasons) !== null && _a !== void 0 ? _a : []), reason]))
            .property("banReasonsAmount", user.banReasonsAmount != null ? user.banReasonsAmount + 1 : 1)
            .iterate();
    });
    return { success: true };
}
exports.banUserPost = banUserPost;
async function removeBanFromUserPost(params, ctx) {
    const { userId, reason } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(passwordValidation.error);
        return;
    }
    const user = await (0, data_conversion_2.fromQueryToUser)((0, queries_1.queryToGetUserById)(userId), false);
    if (!user) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(404, "User not found");
        return;
    }
    if (user.banReasons == null || !user.banReasons.includes(reason)) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(400, "User doesn't have this ban reason");
        return;
    }
    const newBanReasonsList = user.banReasons.filter(banReason => banReason !== reason);
    const newBanReasonsAmount = newBanReasonsList.length;
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserById)(userId)
        .property("banReasons", JSON.stringify(newBanReasonsList))
        .property("banReasonsAmount", newBanReasonsAmount)
        .iterate());
    return { success: true };
}
exports.removeBanFromUserPost = removeBanFromUserPost;
async function removeAllBanReasonsFromUser(params, ctx) {
    const { userId } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(passwordValidation.error);
        return;
    }
    const user = await (0, data_conversion_2.fromQueryToUser)((0, queries_1.queryToGetUserById)(userId), false);
    if (!user) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(404, "User not found");
        return;
    }
    if (user.banReasonsAmount == null || user.banReasonsAmount === 0) {
        ctx === null || ctx === void 0 ? void 0 : ctx.throw(400, "User doesn't have any ban reasons");
        return;
    }
    await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetUserById)(userId)
        .property("banReasons", JSON.stringify([]))
        .property("banReasonsAmount", 0)
        .iterate());
    return { success: true };
}
exports.removeAllBanReasonsFromUser = removeAllBanReasonsFromUser;
async function sendEmailPost(params, ctx) {
    const { to, subject, text } = params;
    const passwordValidation = await (0, validateAdminCredentials_1.validateAdminCredentials)(params);
    if (!passwordValidation.isValid) {
        ctx.throw(passwordValidation.error);
        return;
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