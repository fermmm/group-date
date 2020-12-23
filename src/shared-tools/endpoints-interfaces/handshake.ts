export interface HandshakeParams {
   version: string;
}

export interface ServerHandshakeResponse {
   versionIsCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
   locale: string;
   imagesHost: string;
   serverConfigurations: {
      maxSimultaneousGroups: number;
      minGroupSize: number;
      maxGroupSize: number;
      maximumInactivityForCards: number;
      themesPerTimeFrame: number;
      themeCreationTimeFrame: number;
      maxThemeSubscriptionsAllowed: number;
   };
}
