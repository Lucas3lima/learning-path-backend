import type { InferSelectModel } from 'drizzle-orm'
import type { plants } from '../database/schema.ts'

export type Plant = InferSelectModel<typeof plants>
// export type CreateUserInput = InferInsertModel<typeof plants>

export interface PlantsRepository {
  findById(id: string): Promise<Plant | null>

}
