import { QuestionData } from './questions';

export interface UserRequestParams {
  token: string;
}

export interface ProfileStatusServerResponse {
  missingRegistrationStep?: RequiredRegistrationStep;
}

export interface RequiredRegistrationStep {
  screenType: RegistrationStepScreen;
  screenData?: QuestionData;
}

export enum RegistrationStepScreen {
  BasicInfo = 'BasicInfo',
  ProfilePictures = 'ProfilePictures',
  DateIdea = 'DateIdea',
  ProfileText = 'ProfileText',
  Question = 'Question',
}