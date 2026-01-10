import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { examAttempts } from '../../database/schema.ts'
import type {
  CreateExamAttemptsInput,
  ExamAttempts,
  ExamAttemptsRepository,
} from '../exam-attempts-repository.ts'

export class DrizzleExamAttemptsRepository implements ExamAttemptsRepository {
  async findActiveByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempts | null> {
    const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, userId),
          eq(examAttempts.examId, examId),
          isNull(examAttempts.finished_at),
        ),
      )
      .limit(1)

    return attempt ?? null
  }

  async findFinishedByUserAndExam(
    userId: string,
    examId: string,
    ) {
    const [attempt] = await db
        .select()
        .from(examAttempts)
        .where(
        and(
            eq(examAttempts.userId, userId),
            eq(examAttempts.examId, examId),
            isNotNull(examAttempts.finished_at),
            eq(examAttempts.approved,true)
        ),
        )
        .limit(1)

    return attempt ?? null
    }

  async create(data: CreateExamAttemptsInput): Promise<ExamAttempts> {
    const [attempt] = await db.insert(examAttempts).values(data).returning()

    return attempt
  }

  async finishAttempt(
    attemptId: string,
    score: number,
    approved: boolean,
  ): Promise<void> {
    await db
      .update(examAttempts)
      .set({
        score,
        approved,
        finished_at: new Date(),
      })
      .where(eq(examAttempts.id, attemptId))
  }

  async deleteByUserAndExam(userId: string, examId: string): Promise<boolean> {
    const result = await db
      .delete(examAttempts)
      .where(
        and(eq(examAttempts.userId, userId), eq(examAttempts.examId, examId)),
      )

    return result.rowCount > 0
  }
    async finishActiveAttemptAsFailed(
    userId: string,
    examId: string,
    ) {
    await db
        .update(examAttempts)
        .set({
        finished_at: new Date(),
        score: 0,
        approved: false,
        })
        .where(
        and(
            eq(examAttempts.userId, userId),
            eq(examAttempts.examId, examId),
            isNull(examAttempts.finished_at),
        ),
        )
    }

}
