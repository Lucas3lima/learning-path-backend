import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { lessons } from '../database/schema.ts'

export type Lessons = InferSelectModel<typeof lessons>
export type CreateLessonsInput = InferInsertModel<typeof lessons>

export type EditLessonInput = {
  id: string
  title?: string
  slug?: string
  content?: string
  video_url?: string
  pdf_url?: string
}

export interface LessonsRepository {
  findById(id: string): Promise<Lessons | null>
  findBySlugAndModuleId(slug: string, moduleId: string): Promise<Lessons | null>
  findByIdAndModuleId(id: string, moduleId: string): Promise<Lessons | null>
  findByModuleId(moduleId: string): Promise<Lessons[]>
  create(data: CreateLessonsInput): Promise<Lessons>
  edit(data: EditLessonInput): Promise<Lessons | null>
  delete(id: string): Promise<boolean>
}
