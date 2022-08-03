import QuestionTemplate from './QuestionTemplate';

export default interface FormTemplate {
  id: string,
  title: string,
  questions: QuestionTemplate[],
  description?: string,
  startDate?: string,
  endDate?: string,
  responderUri: string,
// eslint-disable-next-line semi
}
