import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { exams } from '../database/schema.ts'

export type Exams = InferSelectModel<typeof exams>
export type CreateExamsInput = InferInsertModel<typeof exams>

export interface ExamsRepository {
  findById(id: string): Promise<Exams | null>
  findBySlugAndModuleId(slug: string, moduleId: string): Promise<Exams | null>
  findByIdAndModuleId(id: string, moduleId: string): Promise<Exams | null>
  findByModuleId(moduleId: string): Promise<Exams[]>
  create(data: CreateExamsInput): Promise<Exams>
  delete(id: string): Promise<boolean>
}
