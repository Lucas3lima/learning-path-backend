import type { InferInsertModel } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { userPlants } from '../../database/schema.ts'
import type { UserPlantsRepository } from '../userPlants-repository.ts'

export type CreateUserPlantsInput = InferInsertModel<typeof userPlants>

export class DrizzleUserPlantsRepository implements UserPlantsRepository {
  async create(data: CreateUserPlantsInput) {
    const [userPlant] = await db.insert(userPlants).values(data).returning()

    return userPlant
  }
}
