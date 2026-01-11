import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { lessonProgress } from '../database/schema.ts'

export type LessonProgress = InferSelectModel<typeof lessonProgress>
export type CreateLessonProgressInput = InferInsertModel<typeof lessonProgress>


export interface LessonProgressRepository {
  findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null>

  create(
    data: CreateLessonProgressInput,
  ): Promise<LessonProgress>

  findManyByUserAndLessonIds(
    userId: string,
    lessonIds: string[],
  ): Promise<LessonProgress[]>

  deleteByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<boolean>

  findManyCompletedByUserAndLessonIds(
    userId: string,
    lessonIds: string[],
  ): Promise<LessonProgress[]>
}
