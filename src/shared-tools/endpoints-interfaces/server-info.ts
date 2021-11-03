import { Slot } from "./groups";
import { NotificationChannelInfo } from "./user";

export interface ServerInfoParams {
   buildVersion: string;
   codeVersion: string;
}

export interface ServerInfoResponse {
   buildVersionIsCompatible: boolean;
   codeVersionIsCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
   locale: string;
   imagesHost: string;
   emailLoginEnabled: boolean;
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
