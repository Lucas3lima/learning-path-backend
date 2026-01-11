import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { examAttempts } from '../database/schema.ts'

export type ExamAttempts = InferSelectModel<typeof examAttempts>
export type CreateExamAttemptsInput = InferInsertModel<typeof examAttempts>


export interface ExamAttemptsRepository {
  findActiveByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempts | null>

  findFinishedByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempts | null>

  create(
    data: CreateExamAttemptsInput,
  ): Promise<ExamAttempts>

  finishAttempt(
    attemptId: string,
    score: number,
    approved: boolean,
  ): Promise<void>

  deleteByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<boolean>

  finishActiveAttemptAsFailed(
    userId: string,
    examId: string,
  ): Promise<void>

  findManyFinishedByUserAndExamIds(
    userId: string,
    examIds: string[],
  ): Promise<ExamAttempts[]>

}


