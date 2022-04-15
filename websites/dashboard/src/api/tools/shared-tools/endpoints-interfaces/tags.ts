export interface TagBasicInfo {
   tagId: string;
   name: string;
   visible?: boolean;
}

export interface Tag extends TagBasicInfo {
   category: string;
   language: string;
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
   language?: string;
   global?: boolean;
   visible?: boolean;
   fakeSubscribersAmount?: number;
   fakeBlockersAmount?: number;
   creationDate?: number;
   lastInteractionDate?: number;
}

export interface TagGetParams {
   token: string;
   languageFilter?: string | "all";
}

export interface BasicTagParams {
   token: string;
   tagIds: string[];
}

export interface BasicSingleTagParams {
   token: string;
   tagId: string;
}

export interface TagsAsQuestion {
   questionId: string;
   text: string;
   extraText?: string;
   answers: QuestionAnswerData[];
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
   filterSelectedByDefault?: boolean;
   filterSelectionInvisible?: boolean;
}

export interface QuestionAnswerData {
   text: string;
   tagId?: string;
   category?: string;
   tagName?: string;
   tagIsVisible?: boolean;
   extraText?: string;
   unwantedUserAnswer?: boolean;
}

export type TagRelationShip = "subscribed" | "blocked";
