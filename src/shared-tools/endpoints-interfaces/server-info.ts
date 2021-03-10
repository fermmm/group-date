import { Slot } from "./groups";
import { NotificationChannelInfo } from "./user";

export interface ServerInfoParams {
   version: string;
}

export interface ServerInfoResponse {
   versionIsCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
   locale: string;
   imagesHost: string;
   serverConfigurations: {
      groupSlots: Slot[];
      minGroupSize: number;
      maxGroupSize: number;
      maximumInactivityForCards: number;
      tagsPerTimeFrame: number;
      tagCreationTimeFrame: number;
      maxTagSubscriptionsAllowed: number;
   };
   pushNotificationsChannels: NotificationChannelInfo[];
}
