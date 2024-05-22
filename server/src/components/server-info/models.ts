import { BaseContext } from "koa";
import { strToBool, versionIsCompatible } from "../../common-tools/string-tools/string-tools";
import {
   GROUP_SLOTS_CONFIGS,
   MAXIMUM_INACTIVITY_FOR_CARDS,
   MAX_GROUP_SIZE,
   MAX_TAG_SUBSCRIPTIONS_ALLOWED,
   MINIMUM_CLIENT_BUILD_VERSION_ALLOWED,
   MINIMUM_CLIENT_CODE_VERSION_ALLOWED,
   MIN_GROUP_SIZE,
   PUSH_NOTIFICATION_CHANNELS,
   TAGS_PER_TIME_FRAME,
   TAG_CREATION_TIME_FRAME,
} from "../../configurations";
import { ServerInfoParams, ServerInfoResponse } from "../../shared-tools/endpoints-interfaces/server-info";
import { getLocaleFromHeader, t } from "../../common-tools/i18n-tools/i18n-tools";
import { NotificationChannelInfo } from "../../shared-tools/endpoints-interfaces/user";
import { getServerUrl } from "../../common-tools/url-tools/getServerUrl";
import { getImagesHostUrl } from "../../common-tools/url-tools/getUserImagesUrl";

export function serverInfoGet(params: ServerInfoParams, ctx: BaseContext): ServerInfoResponse {
   return {
      serverOperating: strToBool(process.env.SERVER_OPERATING),
      serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
      postLoginMessage: process.env.SHOW_POST_LOGIN_MESSAGE_IN_CLIENT,
      buildVersionIsCompatible: versionIsCompatible(
         params.buildVersion ?? "0.0.0",
         MINIMUM_CLIENT_BUILD_VERSION_ALLOWED,
      ),
      codeVersionIsCompatible: versionIsCompatible(
         params.codeVersion ?? "0.0.0",
         MINIMUM_CLIENT_CODE_VERSION_ALLOWED,
      ),
      locale: getLocaleFromHeader(ctx),
      emailLoginEnabled:
         process.env.AWS_ACCESS_KEY_ID?.length > 1 &&
         process.env.AWS_SECRET_ACCESS_KEY?.length > 1 &&
         process.env.EMAIL_SENDER?.length > 1 &&
         process.env.AWS_REGION?.length > 1 &&
         getServerUrl().length > 1,
      imagesHost: getImagesHostUrl(),
      serverConfigurations: {
         groupSlots: GROUP_SLOTS_CONFIGS,
         minGroupSize: MIN_GROUP_SIZE,
         maxGroupSize: MAX_GROUP_SIZE,
         maximumInactivityForCards: MAXIMUM_INACTIVITY_FOR_CARDS,
         tagsPerTimeFrame: TAGS_PER_TIME_FRAME,
         tagCreationTimeFrame: TAG_CREATION_TIME_FRAME,
         maxTagSubscriptionsAllowed: MAX_TAG_SUBSCRIPTIONS_ALLOWED,
      },
      pushNotificationsChannels: translatePushNotificationChannels(PUSH_NOTIFICATION_CHANNELS, ctx),
   };
}

function translatePushNotificationChannels(channels: NotificationChannelInfo[], ctx: BaseContext) {
   return channels.map(channel => ({ ...channel, name: t(channel.name, { ctx }) }));
}