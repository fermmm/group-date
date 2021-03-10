export interface TagBasicInfo {
   tagId: string;
   name: string;
}

export interface Tag extends TagBasicInfo {
   category: string;
   country: string;
   creationDate: number;
   lastInteractionDate: number;
   global: boolean;
   subscribersAmount: number;
   blockersAmount: number;
}

export interface TagCreateParams {
   token: string;
   name: string;
   category: string;
   country?: string;
   global?: boolean;
}

export interface TagGetParams {
   token: string;
   countryFilter?: string | "all";
}

export interface BasicTagParams {
   token: string;
   tagIds: string[];
}

export interface TagsAsQuestion {
   questionId: string;
   text: string;
   extraText?: string;
   answers: QuestionAnswerData[];
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
}

export interface QuestionAnswerData {
   tagId: string;
   text: string;
   tagName: string;
   category: string;
   extraText?: string;
}

export type TagRelationShip = "subscribed" | "blocked";
