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
   /**
    * This object is used to set which responses are incompatible between each other, allowing users to block other users that select an incompatible response.
    */
   incompatibilitiesBetweenAnswers?: { [key: number]: number[] };
   /**
    * This means that the user can't select if he/she is going to block users that select an incompatible response.
    */
   filterSelectionInvisible?: boolean;
   /**
    * This means that it blocks incompatible users by default. Combined with invisible block selection (the previous prop) forces the users to block the incompatible ones.
    */
   filterSelectedByDefault?: boolean;
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
