import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { examAnswers } from '../../database/schema.ts'
import type {
  CreateExamAnswersInput,
  EditExamAnswersInput,
  ExamAnswers,
  ExamAnswersRepository,
} from '../exam-answers-repository.ts'

export class DrizzleExamAnswersRepository implements ExamAnswersRepository {
  async createMany(data: CreateExamAnswersInput[]): Promise<ExamAnswers[]> {
    const result = await db.insert(examAnswers).values(data).returning()

    return result
  }

  async findByQuestionId(questionId: string): Promise<ExamAnswers[]> {
    const result = await db
      .select()
      .from(examAnswers)
      .where(eq(examAnswers.questionId, questionId))
      .orderBy(examAnswers.order)

    return result
  }

  async findManyByQuestionIds(questionIds: string[]) {
    if (questionIds.length === 0) {
      return []
    }

    return await db
      .select()
      .from(examAnswers)
      .where(inArray(examAnswers.questionId, questionIds))
      .orderBy(examAnswers.questionId, examAnswers.order)
  }

  async edit(data: EditExamAnswersInput): Promise<ExamAnswers | null> {
    const { id, ...fieldsToUpdate } = data

    const result = await db
      .update(examAnswers)
      .set({
        ...fieldsToUpdate,
      })
      .where(eq(examAnswers.id, id))
      .returning()

    if (result.length === 0) {
      return null
    }

    return result[0]
  }

  async deleteByQuestionId(questionId: string) {
    const result = await db
      .delete(examAnswers)
      .where(eq(examAnswers.questionId, questionId))
      .returning({ id: examAnswers.id })

    return result.length > 0
  }

  async nextOrder(questionId: string) {
    const [{ nextOrder }] = await db
      .select({
        nextOrder: sql<number>`COALESCE(MAX(${examAnswers.order}) + 1, 1)`,
      })
      .from(examAnswers)
      .where(eq(examAnswers.questionId, questionId))
    return nextOrder
  }
}
