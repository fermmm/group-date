import { QuestionData } from './questions';

export type RequiredUserProp =
   | 'name'
   | 'birthdate'
   | 'targetAgeMin'
   | 'targetAgeMax'
   | 'pictures'
   | 'dateIdeaName'
   | 'dateIdeaAddress'
   | 'profileDescription';

export interface ProfileStatusServerResponse {
   missingUserProp?: MissingUserProp;
}

export interface MissingUserProp {
   prop: RequiredUserProp;
   questionData?: QuestionData;
}
