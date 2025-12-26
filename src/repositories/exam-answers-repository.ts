import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { examAnswers } from '../database/schema.ts'

export type ExamAnswers = InferSelectModel<typeof examAnswers>
export type CreateExamAnswersInput = InferInsertModel<typeof examAnswers>

export type EditExamAnswersInput = {
  id: string
  title?: string
  isCorrect?: boolean
  order?: number
}

export interface ExamAnswersRepository {
  createMany(
    data: CreateExamAnswersInput[],
  ): Promise<ExamAnswers[]>

  findByQuestionId(
    questionId: string,
  ): Promise<ExamAnswers[]>

  edit(
    data: EditExamAnswersInput,
  ): Promise<ExamAnswers | null>

  deleteByQuestionId(
    questionId: string,
  ): Promise<boolean>

  nextOrder(questionId: string): Promise<number>
}
