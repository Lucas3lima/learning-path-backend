import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { moduleContents } from '../database/schema.ts'

export type ModuleContents = InferSelectModel<typeof moduleContents>
export type CreateModuleContentsInput = InferInsertModel<typeof moduleContents>

export interface ModuleContentsRepository {
  findById(id: string): Promise<ModuleContents | null>
  findByIdAndModuleId(
    id: string,
    moduleId: string,
  ): Promise<ModuleContents | null>
  findByModuleId(moduleId: string): Promise<ModuleContents[]>
  create(data: CreateModuleContentsInput): Promise<ModuleContents>
  delete(id: string): Promise<boolean>
  nextOrder(moduleId: string): Promise<number>
}
