import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { lessons } from '../database/schema.ts'

export type Lessons = InferSelectModel<typeof lessons>
export type CreateLessonsInput = InferInsertModel<typeof lessons>

export interface LessonsRepository {
  findById(id: string): Promise<Lessons | null>
  findBySlugAndModuleId(slug: string, moduleId: string): Promise<Lessons | null>
  findByModuleId(moduleId: string): Promise<Lessons[]>
  create(data: CreateLessonsInput): Promise<Lessons>
  nextOrder(moduleId: string): Promise<number>
}
