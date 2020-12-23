import { BaseContext } from "koa";
import { versionIsCompatible } from "../../common-tools/string-tools/string-tools";
import {
   GROUP_SLOTS_CONFIGS,
   MAXIMUM_INACTIVITY_FOR_CARDS,
   MAX_GROUP_SIZE,
   MAX_THEME_SUBSCRIPTIONS_ALLOWED,
   MIN_GROUP_SIZE,
   THEMES_PER_TIME_FRAME,
   THEME_CREATION_TIME_FRAME,
} from "../../configurations";
import { HandshakeParams, ServerHandshakeResponse } from "../../shared-tools/endpoints-interfaces/handshake";
import { getLocaleFromHeader } from "../../common-tools/i18n-tools/i18n-tools";

export function handshakeGet(params: HandshakeParams, ctx: BaseContext): ServerHandshakeResponse {
   return {
      serverOperating: Boolean(process.env.SERVER_OPERATING),
      serverMessage: process.env.SHOW_MESSAGE_IN_CLIENT,
      versionIsCompatible: versionIsCompatible(params.version, process.env.MINIMUM_CLIENT_VERSION_ALLOWED),
      locale: getLocaleFromHeader(ctx),
      imagesHost: process.env.IMAGES_HOST,
      serverConfigurations: {
         maxSimultaneousGroups: GROUP_SLOTS_CONFIGS.reduce((prev, curr) => prev + curr.amount, 0),
         minGroupSize: MIN_GROUP_SIZE,
         maxGroupSize: MAX_GROUP_SIZE,
         maximumInactivityForCards: MAXIMUM_INACTIVITY_FOR_CARDS,
         themesPerTimeFrame: THEMES_PER_TIME_FRAME,
         themeCreationTimeFrame: THEME_CREATION_TIME_FRAME,
         maxThemeSubscriptionsAllowed: MAX_THEME_SUBSCRIPTIONS_ALLOWED,
      },
   };
}
