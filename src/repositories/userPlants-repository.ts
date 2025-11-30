import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { userPlants } from '../database/schema.ts'

export type UserPlants = InferSelectModel<typeof userPlants>
export type CreateUserPlantsInput = InferInsertModel<typeof userPlants>

export interface UserPlantsRepository {
  create(data: CreateUserPlantsInput): Promise<UserPlants>
  findByUserIdAndPlantId(userId: string,plantId: string): Promise<UserPlants | null>


}
