import AnswerTemplate from './AnswerTemplate';
import QuestionType from './QuestionType';

export default interface QuestionTemplate {
  questionId?: string,
  type: QuestionType,
  text: string,
  tex: boolean,
  answers?: AnswerTemplate[],
  points?: number,
  pointsArray?: Array<number>
// eslint-disable-next-line semi
}
