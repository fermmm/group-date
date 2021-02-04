import { Slot } from "./groups";

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
      themesPerTimeFrame: number;
      themeCreationTimeFrame: number;
      maxThemeSubscriptionsAllowed: number;
   };
}
