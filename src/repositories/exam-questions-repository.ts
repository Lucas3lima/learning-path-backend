import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { examQuestions } from '../database/schema.ts'

export type ExamQuestions = InferSelectModel<typeof examQuestions>
export type CreateExamQuestionsInput = InferInsertModel<typeof examQuestions>

export type EditExamQuestionsInput = {
  id: string
  title?: string
  order?: number
}

export interface ExamQuestionsRepository {
  create(
    data: CreateExamQuestionsInput,
  ): Promise<ExamQuestions>

  findById(
    id: string,
  ): Promise<ExamQuestions | null>

  findByExamId(
    examId: string,
  ): Promise<ExamQuestions[]>

  findByExamIdAndOrder(
    examId: string,
    order: number,
  ): Promise<ExamQuestions | null>

  edit(
    data: EditExamQuestionsInput,
  ): Promise<ExamQuestions | null>

  delete(
    id: string,
  ): Promise<boolean>

  nextOrder(examId: string): Promise<number>
}
