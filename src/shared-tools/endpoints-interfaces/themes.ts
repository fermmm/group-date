export interface Theme {
   themeId: string;
   name: string;
   category: string;
   locationLat: number;
   locationLon: number;
   creationDate: number;
   global: boolean;
}

export interface ThemeCreateParams {
   token: string;
   name: string;
   category: string;
   global?: boolean;
}
