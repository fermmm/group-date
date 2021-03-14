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
   fakeSubscribersAmount?: number;
   fakeBlockersAmount?: number;
   creationDate?: number;
   lastInteractionDate?: number;
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
   text: string;
   tagId?: string;
   category?: string;
   tagName?: string;
   extraText?: string;
}

export type TagRelationShip = "subscribed" | "blocked";
