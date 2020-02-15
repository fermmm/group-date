export interface QuestionData {
  text: string;
  extraText?: string;
  shortVersion?: string;
  multipleAnswersAllowed?: boolean;
  defaultSelectedAnswers?: string[];
  itsImportantSelectedByDefault?: boolean;
  answers: QuestionAnswerData[];
  incompatibilitiesBetweenAnswers?: { [key: string]: string[] };
}

export interface QuestionAnswerData {
  id: string;
  text: string;
  extraText?: string;
  shortVersion?: string;
}