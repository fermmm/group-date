export interface ThemeBasicInfo {
   themeId: string;
   name: string;
}

export interface Theme extends ThemeBasicInfo {
   category: string;
   country: string;
   creationDate: number;
   lastInteractionDate: number;
   global: boolean;
   subscribersAmount: number;
   blockersAmount: number;
}

export interface ThemeCreateParams {
   token: string;
   name: string;
   category: string;
   country?: string;
   global?: boolean;
}

export interface ThemeGetParams {
   token: string;
   countryFilter?: string | "all";
}

export interface BasicThemeParams {
   token: string;
   themeIds: string[];
}

export interface ThemesAsQuestion {
   questionId: string;
   text: string;
   extraText?: string;
   answers: QuestionAnswerData[];
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
}

export interface QuestionAnswerData {
   themeId: string;
   text: string;
   themeName: string;
   extraText?: string;
}

export type ThemeRelationShip = "subscribed" | "blocked";
