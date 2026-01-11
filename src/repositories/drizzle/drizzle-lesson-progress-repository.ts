import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { lessonProgress } from '../../database/schema.ts'
import type {
  CreateLessonProgressInput,
  LessonProgress,
  LessonProgressRepository,
} from '../lesson-progress-repository.ts'

export class DrizzleLessonProgressRepository
  implements LessonProgressRepository
{
  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId),
        ),
      )
      .limit(1)

    return progress ?? null
  }

  async create(
    data: CreateLessonProgressInput,
  ): Promise<LessonProgress> {
    const [progress] = await db
      .insert(lessonProgress)
      .values(data)
      .returning()

    return progress
  }

  async findManyByUserAndLessonIds(
    userId: string,
    lessonIds: string[],
  ): Promise<LessonProgress[]> {
    if (lessonIds.length === 0) {
      return []
    }

    return db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          inArray(lessonProgress.lessonId, lessonIds),
        ),
      )
  }
  async findManyCompletedByUserAndLessonIds(
    userId: string,
    lessonIds: string[],
  ): Promise<LessonProgress[]> {
    if (lessonIds.length === 0) {
      return []
    }

    return db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          inArray(lessonProgress.lessonId, lessonIds),
          eq(lessonProgress.completed,true),
        ),
      )
  }

  async deleteByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<boolean> {
    const deleted = await db
      .delete(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId),
        ),
      )
      .returning({ id: lessonProgress.id })

    return deleted.length > 0
  }
}
