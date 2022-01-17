"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverInfoGet = void 0;
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const configurations_1 = require("../../configurations");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const getServerUrl_1 = require("../../common-tools/url-tools/getServerUrl");
const getUserImagesUrl_1 = require("../../common-tools/url-tools/getUserImagesUrl");
function serverInfoGet(params, ctx) {
    var _a, _b, _c, _d, _e, _f;
    return {
        serverOperating: (0, string_tools_1.strToBool)(process.env.SERVER_OPERATING),
        serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
        buildVersionIsCompatible: (0, string_tools_1.versionIsCompatible)((_a = params.buildVersion) !== null && _a !== void 0 ? _a : "0.0.0", configurations_1.MINIMUM_CLIENT_BUILD_VERSION_ALLOWED),
        codeVersionIsCompatible: (0, string_tools_1.versionIsCompatible)((_b = params.codeVersion) !== null && _b !== void 0 ? _b : "0.0.0", configurations_1.MINIMUM_CLIENT_CODE_VERSION_ALLOWED),
        locale: (0, i18n_tools_1.getLocaleFromHeader)(ctx),
        emailLoginEnabled: ((_c = process.env.AWS_ACCESS_KEY_ID) === null || _c === void 0 ? void 0 : _c.length) > 1 &&
            ((_d = process.env.AWS_SECRET_ACCESS_KEY) === null || _d === void 0 ? void 0 : _d.length) > 1 &&
            ((_e = process.env.EMAIL_SENDER) === null || _e === void 0 ? void 0 : _e.length) > 1 &&
            ((_f = process.env.AWS_REGION) === null || _f === void 0 ? void 0 : _f.length) > 1 &&
            (0, getServerUrl_1.getServerUrl)().length > 1,
        imagesHost: (0, getUserImagesUrl_1.getImagesHostUrl)(),
        serverConfigurations: {
            groupSlots: configurations_1.GROUP_SLOTS_CONFIGS,
            minGroupSize: configurations_1.MIN_GROUP_SIZE,
            maxGroupSize: configurations_1.MAX_GROUP_SIZE,
            maximumInactivityForCards: configurations_1.MAXIMUM_INACTIVITY_FOR_CARDS,
            tagsPerTimeFrame: configurations_1.TAGS_PER_TIME_FRAME,
            tagCreationTimeFrame: configurations_1.TAG_CREATION_TIME_FRAME,
            maxTagSubscriptionsAllowed: configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED,
        },
        pushNotificationsChannels: translatePushNotificationChannels(configurations_1.PUSH_NOTIFICATION_CHANNELS, ctx),
    };
}
exports.serverInfoGet = serverInfoGet;
function translatePushNotificationChannels(channels, ctx) {
    return channels.map(channel => ({ ...channel, name: (0, i18n_tools_1.t)(channel.name, { ctx }) }));
}
//# sourceMappingURL=models.js.map