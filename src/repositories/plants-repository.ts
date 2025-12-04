import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { plants } from '../database/schema.ts'

export type Plant = InferSelectModel<typeof plants>
export type CreatePlantInput = InferInsertModel<typeof plants>

export interface PlantsRepository {
  findById(id: string): Promise<Plant | null>
  create(data: CreatePlantInput): Promise<Plant>

}
