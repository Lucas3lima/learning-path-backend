import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { examQuestions } from '../../database/schema.ts'
import type { CreateExamQuestionsInput, EditExamQuestionsInput, ExamQuestionsRepository } from '../exam-questions-repository.ts'

export class DrizzleExamQuestionsRepository implements ExamQuestionsRepository {
  async findById(id: string) {
    const [examQuestion] = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.id, id))

    if (!examQuestion) {
      return null
    }

    return examQuestion
  }

  async findByExamId(examId: string) {
    return await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.order)
  }
  async findByExamIdAndOrder(examId: string, order: number) {
    const [examQuestion] = await db
      .select()
      .from(examQuestions)
      .where(
        and(
          eq(examQuestions.examId, examId),
          eq(examQuestions.order, order)
        )
      )

    if (!examQuestion) {
      return null
    }

    return examQuestion
  }
  async create(data: CreateExamQuestionsInput) {
    const [examQuestion] = await db.insert(examQuestions).values(data).returning()

    return examQuestion
  }
  async delete(id: string) {
    const result = await db
      .delete(examQuestions)
      .where(eq(examQuestions.id, id))
      .returning({ id: examQuestions.id })

    // Se deletou, result[0] existe
    return result.length > 0
  }


  async edit(data: EditExamQuestionsInput) {
    const { id, ...fields } = data

    const [updated] = await db
      .update(examQuestions)
      .set(fields)
      .where(eq(examQuestions.id, id))
      .returning()

    return updated ?? null
  }

  async nextOrder(examId: string) {
    const [{ nextOrder }] = await db
      .select({
        nextOrder: sql<number>`COALESCE(MAX(${examQuestions.order}) + 1, 1)`,
      })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
    return nextOrder
  }
}
