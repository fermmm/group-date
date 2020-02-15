import { QuestionData } from './questions';

export interface LoginRequestParams {
  token: string;
}

export interface ServerLoginResponse {
  success: boolean;
  showRegistrationStepScreen?: RequiredRegistrationStep;
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